/**
 * Why each gap hurts: a short attack/failure path, three 0-5 meters
 * (hackable / weak / expensive) and one concrete scenario. Keyed by audit check id.
 * Costs are order-of-magnitude illustrations, not quotes.
 */
export interface Impact {
  path: string[]; // left → right; nodes after `gap` fall when the gap is used
  gap: number; // index of the node where the design is open
  scenario: string;
  hack: number;
  weak: number;
  cost: number;
  price: string;
}

const I = (path: string[], gap: number, scenario: string, hack: number, weak: number, cost: number, price: string): Impact => ({ path, gap, scenario, hack, weak, cost, price });

export const IMPACT: Record<string, Impact> = {
  waf: I(["Attacker", "Public site", "App server", "Customer data"], 1, "A bad request abuses the app itself. The firewall sees normal port 443 traffic and lets it through; only a WAF reads the request.", 5, 4, 5, "One breach: tens of thousands to millions in response, fines and lost trust."),
  apps: I(["Attacker", "Mobile app / API", "Backend", "User accounts"], 1, "Apps and APIs nobody listed are unprotected by default: no auth review, no rate limit, no WAF rule.", 4, 4, 3, "An unmanaged API is the usual source of data scraping and account takeover."),
  publicSsh: I(["Internet bots", "Port 22", "Server shell", "Whole network"], 1, "Bots try thousands of passwords per hour on every open SSH port. One weak key or password is a shell.", 5, 3, 4, "Rebuild of compromised servers plus incident response."),
  vpn: I(["Admin", "Site-to-site link", "Everything", "Every segment"], 1, "A site link connects networks but does not know who you are. Anyone on one side reaches the other.", 3, 4, 3, "Broader blast radius for any single stolen laptop."),
  dmz: I(["Internet", "Web host", "Internal LAN", "ERP / files"], 2, "With no DMZ a compromised web host already sits inside the LAN and sees everything next to it.", 5, 4, 4, "A web bug becomes a full internal compromise."),
  ddos: I(["Flood", "Edge link", "Firewall", "Service down"], 1, "Without rate limits or scrubbing, a cheap flood fills the link and takes the service offline.", 3, 5, 4, "Hours of downtime; lost sales or lost lectures."),
  baseServices: I(["Laptop", "DHCP / DNS / NTP", "Network", "No IP, no TLS"], 1, "Default-deny with no DHCP, DNS or NTP rule: clients get no address, names do not resolve, certificates fail on time drift.", 1, 5, 2, "A morning of outage while someone hunts the missing rule."),
  defaultDeny: I(["Unknown traffic", "Last rule", "Policy gap", "Allowed by default"], 1, "If nothing ends the list with a deny, anything you did not think about may pass.", 4, 3, 2, "Unknown holes you only find after an incident."),
  shadowed: I(["Packet", "Broad allow", "Specific deny", "Never reached"], 1, "First match wins. The broad allow decides first and every deny below it is dead code.", 4, 4, 2, "You believe traffic is blocked; it is not."),
  fiveProducts: I(["Budget", "One quote", "No comparison", "Overpay"], 2, "Without five compared options with prices you cannot show the choice was best value or the right size.", 1, 3, 4, "Typically 20 to 40 percent over a compared price."),
  undersized: I(["Users", "Fast link", "Slow firewall", "Bottleneck"], 2, "The box is rated slower than the link, and slower still with IPS on. It becomes the choke point at peak.", 2, 5, 4, "You paid for bandwidth you cannot use, then replace the box early."),
  subnetSizing: I(["Students", "Small subnet", "No free IPs", "Cannot connect"], 1, "Each person brings 2 to 3 devices. A subnet sized for heads runs out on day one.", 1, 5, 3, "Re-addressing a live campus is painful and risky."),
  segmentation: I(["Developer laptop", "Shared VLAN", "R&D files", "Source code"], 1, "R&D and developers share a segment with everyone, so one infected laptop reaches the sensitive data.", 4, 4, 4, "Leaked source or research is rarely recoverable."),
  mgmt: I(["Any user", "Flat LAN", "Firewall admin UI", "Full control"], 1, "Without a management VLAN, admin interfaces are reachable from ordinary networks.", 5, 3, 4, "Whoever reaches the admin page can rewrite every rule."),
  monitoring: I(["Attack", "Alert", "Noise", "Nobody looks"], 2, "App uptime noise and security alerts land in the same place, so the one that matters is buried.", 3, 4, 3, "Breaches found months late cost the most."),
  cve: I(["New CVE", "Not tracked", "Unpatched", "Exploited"], 1, "No one watches advisories, so a public bug sits open while attackers scan for it.", 4, 3, 3, "The patch is free; the incident is not."),
  exposedAdmin: I(["Scanner", "RDP / SMB / DB port", "Server", "Ransomware"], 1, "These ports are scanned within minutes of exposure and are the classic ransomware entry.", 5, 4, 5, "Ransomware recovery easily reaches six figures."),
  wideOpen: I(["Anyone", "Allow any / any", "Everything", "No control"], 1, "A rule with no port or protocol is not a rule; it is a hole labeled with a reason.", 5, 4, 3, "An audit finding at best, a breach at worst."),
  dmzToLan: I(["Popped web host", "DMZ", "Allowed path", "Internal servers"], 2, "The DMZ is allowed inward on any port, so a hacked web host walks straight in.", 5, 4, 4, "Contained web bug turns into full compromise."),
  rndInternet: I(["R&D host", "Open egress", "Internet", "Data leaves"], 1, "R&D can reach the internet directly, so malware or a careless upload exfiltrates research with nothing to stop it.", 4, 3, 4, "Stolen IP is a permanent loss."),
  plainHttp: I(["User", "Port 80 only", "Plain text", "Sniffed"], 1, "Traffic without TLS can be read and changed on any network in between.", 4, 2, 2, "Browser warnings and lost trust."),
  weakNotes: I(["Reviewer", "Rule", "No reason", "Cannot explain"], 2, "A rule nobody can explain cannot be safely changed or removed, so it stays forever.", 2, 4, 2, "Hours per audit and fear of touching the policy."),
  dupRules: I(["Packet", "Rule 4", "Same as rule 9", "Wasted time"], 2, "Duplicates cost matching time under load and hide the real intent.", 1, 3, 2, "Small speed loss, large confusion."),
  deadDeny: I(["Packet", "Allow above", "Deny below", "Never fires"], 2, "You wrote a deny, the allow above wins, and you believe it is protecting you.", 4, 4, 2, "A false sense of security is the worst kind."),
  rejectEdge: I(["Scanner", "Reject reply", "Firewall revealed", "Targeted"], 1, "`reject` answers, so scanners learn a firewall is there and what it filters.", 2, 2, 1, "Free recon for the attacker."),
  spof: I(["Users", "One firewall", "Failure", "Site offline"], 1, "One firewall at a critical site means one failed power supply stops the whole site.", 1, 5, 4, "Hours offline; a second box costs less than the outage."),
  isp: I(["Branch", "One ISP link", "Cut / outage", "Offline"], 1, "A single link is a single point of failure for the site, and for the VPN back to HQ.", 1, 5, 4, "Every outage stops work. A backup LTE line is cheap."),
  guestIot: I(["Visitor / camera", "Shared VLAN", "Staff network", "Payment / ERP"], 1, "Untrusted devices share a network with staff, so a cheap camera becomes a stepping stone.", 4, 3, 3, "IoT botnets and lateral movement start here."),
  vlanOutside: I(["Branch block", "VLAN outside it", "Routes break", "Unreachable"], 1, "A VLAN carved outside its branch block will not summarize or route cleanly across the VPN.", 1, 5, 3, "Hours of troubleshooting per branch."),
  overlapVlan: I(["Host A", "Same addresses", "Host B", "Conflict"], 1, "Two VLANs on the same range cannot both route; one silently stops working.", 1, 5, 3, "Intermittent outages that are hard to trace."),
  overlapBranch: I(["Branch 1", "10.10.0.0/16", "Branch 2 also /16", "VPN broken"], 1, "Two sites on one range cannot reach each other over the VPN.", 1, 5, 4, "Renumbering a live site is a project, not a fix."),
  vlanIds: I(["Switch", "Bad VLAN id", "Trunk", "Dropped frames"], 1, "Ids outside 1-4094 or reused ones break the trunk or merge networks by mistake.", 2, 4, 2, "Silent segmentation failures."),
  branchCapacity: I(["People", "Small block", "No growth", "Re-address"], 1, "The whole branch block is smaller than its device count.", 1, 5, 3, "Re-addressing under load."),
  chosenReason: I(["Manager", "Why this box?", "No answer", "Unjustified spend"], 2, "A product with no reason cannot be defended in an audit or a budget meeting.", 1, 3, 3, "A weak purchase gets cut or replaced."),
  whyNot: I(["Reviewer", "Alternatives", "No reasons", "Looks guessed"], 2, "Without why-not notes the comparison reads as a guess, not an evaluation.", 1, 2, 2, "Lost credit and no learning."),
  siem: I(["Attack", "Alert fired", "No owner", "Ignored"], 2, "An alert with no owner and no destination is an alert nobody answers.", 4, 5, 4, "Mean time to detect measured in months."),
  retention: I(["Incident", "Look back", "Logs gone", "No evidence"], 2, "Without retention you cannot investigate or prove anything after the fact.", 3, 4, 4, "Legal exposure under log-keeping rules."),
  cveWeak: I(["CVE tracked", "No plan", "Still open", "Exploited"], 1, "You know the bug exists but no mitigation or patch date is written down.", 4, 3, 3, "Knowing without acting is the expensive middle."),
  mfa: I(["Stolen password", "VPN login", "No second factor", "Inside"], 2, "A single stolen password is enough to enter the network.", 5, 4, 4, "Credential theft is the most common first step."),
  backup: I(["Firewall dies", "Config lost", "Rebuild by memory", "Days down"], 1, "No saved config means re-creating every rule from memory, mistakes included.", 2, 5, 4, "Days of rebuild for what is a nightly export."),
  patching: I(["Vendor advisory", "No routine", "Old firmware", "Exploited"], 1, "Firewalls have CVEs too; an unpatched edge device is a known entry point.", 5, 3, 3, "A monthly window costs hours; a breach costs far more."),
  compliance: I(["Regulator", "No KVKK / GDPR", "Missing evidence", "Fine"], 1, "Personal data with no named regime means no retention, no consent trail, no breach process.", 2, 3, 5, "Fines scale with turnover and data volume.")
};
