import struct
import hashlib
import zlib
import os

def uleb128(val):
    res = bytearray()
    while True:
        b = val & 0x7F
        val >>= 7
        if val > 0:
            res.append(b | 0x80)
        else:
            res.append(b)
            break
    return bytes(res)

def build_minimal_dex():
    # Strings (sorted)
    strings = [
        "<init>",
        "Lcom/testlab/vulnerable/MainActivity;",
        "Ljava/lang/Object;",
        "MainActivity.java",
        "V",
    ]
    
    # Types (sorted string indices)
    # Type 0: Lcom/testlab/vulnerable/MainActivity; -> string 1
    # Type 1: Ljava/lang/Object;                    -> string 2
    # Type 2: V                                     -> string 4
    type_ids = [1, 2, 4]
    
    # Protos
    # Proto 0: shorty_idx=4 ("V"), return_type_idx=2 (V), parameters_off=0
    # struct proto_id_item: uint shorty_idx, uint return_type_idx, uint parameters_off
    proto_ids = [(4, 2, 0)]
    
    # Methods
    # Method 0: class_idx=0 (MainActivity), proto_idx=0, name_idx=0 ("<init>")
    # struct method_id_item: ushort class_idx, ushort proto_idx, uint name_idx
    method_ids = [(0, 0, 0)]
    
    # Code item for <init>:
    # ushort registers_size = 1
    # ushort ins_size = 1
    # ushort outs_size = 0
    # ushort tries_size = 0
    # uint debug_info_off = 0
    # uint insns_size = 1 (1 16-bit code unit)
    # ushort insns[1] = 0x000e (return-void)
    code_item = struct.pack("<HHHHIIH", 1, 1, 0, 0, 0, 1, 0x000E)
    # Align to 4 bytes
    if len(code_item) % 4 != 0:
        code_item += b"\x00" * (4 - (len(code_item) % 4))
        
    # Class data item:
    # uleb128 static_fields_size (0)
    # uleb128 instance_fields_size (0)
    # uleb128 direct_methods_size (1)
    # uleb128 virtual_methods_size (0)
    # direct_methods:
    #   uleb128 method_idx_diff (0)
    #   uleb128 access_flags (0x10001 = ACC_PUBLIC | ACC_CONSTRUCTOR)
    #   uleb128 code_off (filled later)
    
    # Now let's lay out the offsets
    # Header: 0x70 (112 bytes)
    header_size = 0x70
    
    string_ids_off = header_size
    string_ids_size = len(strings)
    
    type_ids_off = string_ids_off + (string_ids_size * 4)
    type_ids_size = len(type_ids)
    
    proto_ids_off = type_ids_off + (type_ids_size * 4)
    proto_ids_size = len(proto_ids)
    
    field_ids_off = 0
    field_ids_size = 0
    
    method_ids_off = proto_ids_off + (proto_ids_size * 12)
    method_ids_size = len(method_ids)
    
    class_defs_off = method_ids_off + (method_ids_size * 8)
    class_defs_size = 1
    
    data_off = class_defs_off + (class_defs_size * 32)
    
    # Data section begins at data_off
    # In data section:
    # 1. string_data_items
    string_data_bytes = []
    string_data_offs = []
    cur_data_off = data_off
    for s in strings:
        string_data_offs.append(cur_data_off)
        raw = s.encode("utf-8")
        sdata = uleb128(len(s)) + raw + b"\x00"
        string_data_bytes.append(sdata)
        cur_data_off += len(sdata)
        
    # Align 4
    if cur_data_off % 4 != 0:
        pad = 4 - (cur_data_off % 4)
        cur_data_off += pad
        string_data_bytes.append(b"\x00" * pad)
        
    # 2. code_item
    code_off = cur_data_off
    cur_data_off += len(code_item)
    
    # 3. class_data_item
    class_data_off = cur_data_off
    class_data_bytes = (
        uleb128(0) +  # static_fields
        uleb128(0) +  # instance_fields
        uleb128(1) +  # direct_methods
        uleb128(0) +  # virtual_methods
        uleb128(0) +  # method_idx_diff (0)
        uleb128(0x10001) +  # ACC_PUBLIC | ACC_CONSTRUCTOR
        uleb128(code_off)
    )
    cur_data_off += len(class_data_bytes)
    
    # Align 4
    if cur_data_off % 4 != 0:
        pad = 4 - (cur_data_off % 4)
        cur_data_off += pad
        class_data_bytes += b"\x00" * pad
        
    # 4. map_list
    map_list_off = cur_data_off
    # Types of items:
    # 0x0000: header (1)
    # 0x0001: string_id_item (5)
    # 0x0002: type_id_item (3)
    # 0x0003: proto_id_item (1)
    # 0x0005: method_id_item (1)
    # 0x0006: class_def_item (1)
    # 0x2002: string_data_item (5)
    # 0x2001: code_item (1)
    # 0x2000: class_data_item (1)
    # 0x1000: map_list (1)
    map_items = [
        (0x0000, 1, 0),
        (0x0001, string_ids_size, string_ids_off),
        (0x0002, type_ids_size, type_ids_off),
        (0x0003, proto_ids_size, proto_ids_off),
        (0x0005, method_ids_size, method_ids_off),
        (0x0006, class_defs_size, class_defs_off),
        (0x2002, string_ids_size, string_data_offs[0]),
        (0x2001, 1, code_off),
        (0x2000, 1, class_data_off),
        (0x1000, 1, map_list_off)
    ]
    map_list_bytes = struct.pack("<I", len(map_items))
    for mtype, msize, moff in map_items:
        map_list_bytes += struct.pack("<HHII", mtype, 0, msize, moff)
    cur_data_off += len(map_list_bytes)
    
    file_size = cur_data_off
    data_size = file_size - data_off
    
    # Construct sections
    string_ids_section = b"".join(struct.pack("<I", off) for off in string_data_offs)
    type_ids_section = b"".join(struct.pack("<I", sidx) for sidx in type_ids)
    proto_ids_section = b"".join(struct.pack("<III", s, r, p) for s, r, p in proto_ids)
    method_ids_section = b"".join(struct.pack("<HHI", c, p, n) for c, p, n in method_ids)
    
    # class_def_item:
    # uint class_idx (0: MainActivity)
    # uint access_flags (0x0001: ACC_PUBLIC)
    # uint superclass_idx (1: Object)
    # uint interfaces_off (0)
    # uint source_file_idx (3: MainActivity.java)
    # uint annotations_off (0)
    # uint class_data_off
    # uint static_values_off (0)
    class_defs_section = struct.pack(
        "<IIIIIIII",
        0, 0x0001, 1, 0, 3, 0, class_data_off, 0
    )
    
    data_section = (
        b"".join(string_data_bytes) +
        code_item +
        class_data_bytes +
        map_list_bytes
    )
    
    # Build payload without header checksum/signature
    # Header format:
    # magic: 8 bytes: b"dex\n035\x00"
    # checksum: 4 bytes (adler32 over rest of file from offset 12)
    # signature: 20 bytes (sha1 over rest of file from offset 32)
    # file_size: uint
    # header_size: uint (0x70)
    # endian_tag: uint (0x12345678)
    # link_size: uint (0)
    # link_off: uint (0)
    # map_off: uint
    # string_ids_size: uint
    # string_ids_off: uint
    # type_ids_size: uint
    # type_ids_off: uint
    # proto_ids_size: uint
    # proto_ids_off: uint
    # field_ids_size: uint (0)
    # field_ids_off: uint (0)
    # method_ids_size: uint
    # method_ids_off: uint
    # class_defs_size: uint
    # class_defs_off: uint
    # data_size: uint
    # data_off: uint
    
    header_tail = struct.pack(
        "<IIIIIIIIIIIIIIII",
        file_size,
        header_size,
        0x12345678,
        0, 0,
        map_list_off,
        string_ids_size, string_ids_off,
        type_ids_size, type_ids_off,
        proto_ids_size, proto_ids_off,
        0, 0,
        method_ids_size, method_ids_off,
    ) + struct.pack(
        "<IIII",
        class_defs_size, class_defs_off,
        data_size, data_off
    )
    
    body = (
        header_tail +
        string_ids_section +
        type_ids_section +
        proto_ids_section +
        method_ids_section +
        class_defs_section +
        data_section
    )
    
    signature = hashlib.sha1(body).digest()
    assert len(signature) == 20
    
    signed_block = signature + body
    checksum = zlib.adler32(signed_block) & 0xFFFFFFFF
    
    dex_bytes = b"dex\n035\x00" + struct.pack("<I", checksum) + signed_block
    assert len(dex_bytes) == file_size
    return dex_bytes

if __name__ == "__main__":
    dex = build_minimal_dex()
    out = os.path.join(os.path.dirname(__file__), "classes.dex")
    with open(out, "wb") as f:
        f.write(dex)
    print(f"Generated minimal valid DEX: {out} ({len(dex)} bytes)")
