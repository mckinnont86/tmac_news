// McGrid page script (loaded by index.html; kept out of the HTML so the
// Content-Security-Policy can block any script injected via feed content).
// DATE
const now = new Date();
document.getElementById('ds').innerHTML =
  now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}) +
  '<br>' + now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
const sbDate = document.getElementById('sb-date');
if(sbDate) sbDate.textContent = now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) + ' · ' + now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});

// TABS
const loadedTabs = new Set();

function activateTab(key) {
  document.querySelectorAll('.tab-btn,.sb-btn,.mob-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll(`[data-tab="${key}"]`).forEach(b => b.classList.add('active'));
  document.getElementById('panel-' + key).classList.add('active');
  // Auto-fetch news if this tab hasn't been loaded yet
  if (key !== 'home' && !loadedTabs.has(key)) {
    loadedTabs.add(key);
    fetchPanel(key);
  }
  // Home: load headlines automatically first visit
  if (key === 'home' && !loadedTabs.has('home')) {
    loadedTabs.add('home');
    loadHomeHeadlines();
  }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// ── VERIFIED WORKING FEEDS (tested against rss2json) ──────────────────────
const API = 'https://api.rss2json.com/v1/api.json?rss_url=';

const NEWS_FEEDS = {
  it: [
    {url:'https://techcrunch.com/feed/',                             label:'TechCrunch'},
    {url:'https://www.theverge.com/rss/index.xml',                   label:'The Verge'},
    {url:'https://siliconangle.com/feed/',                           label:'SiliconAngle'},
    {url:'https://news.ycombinator.com/rss',                         label:'Hacker News'},
    {url:'https://www.wired.com/feed/category/business/latest/rss',  label:'Wired Business'},
    {url:'https://www.helpnetsecurity.com/feed/',                    label:'Help Net Security'},
  ],
  net: [
    {url:'https://feeds.packetpushers.net/packetpushersfullfeed/',             label:'Packet Pushers'},
    {url:'https://www.networkworld.com/feed/',           label:'Network World'},
    {url:'https://www.helpnetsecurity.com/feed/',       label:'Help Net Security'},
    {url:'https://feeds.feedburner.com/TheHackersNews', label:'The Hacker News'},
    {url:'https://www.bleepingcomputer.com/feed/',      label:'BleepingComputer'},
  ],
  sec: [
    {url:'https://krebsonsecurity.com/feed/',           label:'Krebs on Security'},
    {url:'https://www.bleepingcomputer.com/feed/',      label:'BleepingComputer'},
    {url:'https://feeds.feedburner.com/TheHackersNews', label:'The Hacker News'},
    {url:'https://cyberscoop.com/feed/',                label:'CyberScoop'},
    {url:'https://isc.sans.edu/rssfeed_full.xml',       label:'SANS ISC'},
    {url:'https://www.tenable.com/blog/feed',           label:'Tenable Blog'},
    {url:'https://www.helpnetsecurity.com/feed/',       label:'Help Net Security'},
  ],
  ot: [
    {url:'https://securityaffairs.com/feed',            label:'Security Affairs'},
    {url:'https://www.govinfosecurity.com/rss-feeds',   label:'GovInfoSecurity'},
    {url:'https://cyberscoop.com/feed/',                label:'CyberScoop'},
    {url:'https://therecord.media/feed',                label:'The Record'},
    {url:'https://www.helpnetsecurity.com/feed/',       label:'Help Net Security'},
    {url:'https://feeds.feedburner.com/TheHackersNews', label:'The Hacker News'},
  ],
  hc: [
    {url:'https://www.fiercehealthcare.com/rss/xml',    label:'Fierce Healthcare'},
    {url:'https://www.bankinfosecurity.com/rss-feeds',  label:'BankInfoSecurity'},
    {url:'https://securityaffairs.com/feed',            label:'Security Affairs'},
    {url:'https://www.govinfosecurity.com/rss-feeds',   label:'GovInfoSecurity'},
    {url:'https://cyberscoop.com/feed/',                label:'CyberScoop'},
    {url:'https://feeds.feedburner.com/TheHackersNews', label:'The Hacker News'},
  ],
  fin: [
    {url:'https://www.finextra.com/rss/headlines.aspx',      label:'Finextra'},
    {url:'https://www.bankinfosecurity.com/rss-feeds',        label:'BankInfoSecurity'},
    {url:'https://feeds.feedburner.com/TheHackersNews',       label:'The Hacker News'},
    {url:'https://www.helpnetsecurity.com/feed/',             label:'Help Net Security'},
  ],
  training: [
    {url:'https://www.menshealth.com/rss/all.xml/',    label:'Men\'s Health'},
    {url:'https://www.outsideonline.com/feed/',        label:'Outside Online'},
    {url:'https://www.boxrox.com/feed/',               label:'BOXROX'},
    {url:'https://www.eatthis.com/feed/',              label:'Eat This, Not That'},
    {url:'https://www.precisionnutrition.com/feed',    label:'Precision Nutrition'},
  ],
  mw: [
    {url:'https://www.cnbc.com/id/10001147/device/rss/rss.html',    label:'CNBC Finance'},
    {url:'https://www.bankinfosecurity.com/rss-feeds',                  label:'BankInfoSecurity'},
    {url:'https://money.com/money/feed/',                                  label:'Money Magazine'},
    {url:'https://www.cnbc.com/id/10000664/device/rss/rss.html',    label:'CNBC Personal Finance'},
    {url:'https://www.cnbc.com/id/15839069/device/rss/rss.html',    label:'CNBC Investing'},
    {url:'https://www.cnbc.com/id/20910258/device/rss/rss.html',    label:'CNBC Economy'},
    {url:'https://www.fool.com/a/feeds/foolwatch?apikey=foolwatch-feed',                   label:'Motley Fool'},
    {url:'https://seekingalpha.com/feed.xml',                       label:'Seeking Alpha'},
    {url:'https://www.bloomberg.com/feeds/markets/news.rss',        label:'Bloomberg'},
    {url:'https://www.federalreserve.gov/feeds/press_all.xml',      label:'Federal Reserve'},
  ],

  ai: [
    {url:'https://techcrunch.com/category/artificial-intelligence/feed/', label:'TechCrunch AI'},
    {url:'https://openai.com/news/rss.xml',                              label:'OpenAI Blog'},
    {url:'https://deepmind.google/blog/rss.xml',                         label:'Google DeepMind'},
    {url:'https://huggingface.co/blog/feed.xml',                         label:'Hugging Face'},
    {url:'https://towardsdatascience.com/feed/',                          label:'Towards Data Science'},
    {url:'https://www.wired.com/feed/tag/ai/latest/rss',                 label:'Wired AI'},
  ],
  ltc: [
    {url:'https://blog.python.org/feeds/posts/default',  label:'Python Blog'},
    {url:'https://dev.to/feed',                          label:'DEV Community'},
    {url:'https://github.blog/feed/',                    label:'GitHub Blog'},
    {url:'https://towardsdatascience.com/feed/',          label:'Towards Data Science'},
    {url:'https://machinelearningmastery.com/feed/',     label:'ML Mastery'},
    {url:'https://www.freecodecamp.org/news/rss/',       label:'freeCodeCamp'},
    {url:'https://thenewstack.io/feed',                  label:'The New Stack'},
  ],
  diy: [
    {url:'https://www.familyhandyman.com/feed/',         label:'Family Handyman'},
    {url:'https://www.bobvila.com/feed/',                  label:'Bob Vila'},
    {url:'https://www.askthebuilder.com/feed/',           label:'Ask the Builder'},
  ],
  tv: [
    {url:'https://www.thecommontraveler.net/feed/',        label:'The Common Traveler'},
    {url:'https://www.outsideonline.com/feed/',            label:'Outside Online'},
    {url:'https://www.cntraveler.com/feed/rss',            label:'Condé Nast Traveler'},
  ],
  golf: [
    {url:'https://golf.com/feed/',                     label:'Golf.com'},
    {url:'https://mygolfspy.com/feed/',                    label:'MyGolfSpy'},
    {url:'https://www.golfpass.com/travel-advisor/articles.rss',       label:'Golf Advisor'},
  ],
  cissp: [
    {url:'https://www.helpnetsecurity.com/feed/',        label:'Help Net Security'},
    {url:'https://www.govinfosecurity.com/rss-feeds',    label:'GovInfoSecurity'},
    {url:'https://www.bankinfosecurity.com/rss-feeds',   label:'BankInfoSecurity'},
    {url:'https://securityaffairs.com/feed',             label:'Security Affairs'},
    {url:'https://cyberscoop.com/feed/',                 label:'CyberScoop'},
    {url:'https://feeds.feedburner.com/TheHackersNews',  label:'The Hacker News'},
    {url:'https://krebsonsecurity.com/feed/',            label:'Krebs on Security'},
  ]

};

// Keywords to filter by tab for relevance
const KEYWORDS = {
  it:       ['cloud computing','artificial intelligence','machine learning','saas','devops','kubernetes','docker','aws','azure','google cloud','software development','digital transformation','data center','enterprise software','open source','platform engineering','generative ai','llm','chatgpt','copilot','automation','it operations','apple','microsoft','google','meta','nvidia','chip','semiconductor'],
  net:      ['network','firewall','router','switch','vpn','dns','ddos','bandwidth','latency','packet','protocol','tcp','udp','port scan','botnet','proxy','cdn','traffic','wireless','wi-fi','5g','microsegmentation','sd-wan','sdn','vlan','bgp','ospf','mpls','zero trust network','overlay','vxlan','routing','netops','packet pushers','network security','network architecture','network monitoring','network engineer','network infrastructure','network access'],
  sec:      ['ransomware','malware','data breach','exploit','vulnerability','cve-','zero-day','phishing','nation-state','threat actor','apt','cyberattack','hacker','trojan','spyware','botnet','credential stuffing','brute force','social engineering','cyber incident','dark web','stolen data','threat intelligence','siem','edr','xdr','ioc','threat hunt','penetration test','red team','bug bounty'],
  ot:       ['ics','scada','industrial','plc','operational technology','critical infrastructure','power grid','energy sector','pipeline','water utility','manufacturing','factory','purdue','modbus','dnp3','opc','dragos','claroty','nozomi','ot security','ics security','industrial control','infrastructure attack','utility','grid attack','water treatment','oil and gas','control system','supervisory','remote terminal','infrastructure','energy','grid','sector attack','facility','operational'],
  hc:       ['hospital','healthcare','medical','patient','hipaa','clinical','ehr','emr','iomt','pharmacy','telehealth','nursing','physician','medicare','medicaid','fda','healthcare provider','health provider','health system','health care','health data','health insurance','medtech','medical device','care delivery','ransomware hospital','health breach','health record','enrollment','cms','health plan','behavioral health'],
  fin:      ['bank','financial institution','fintech','sec rule','dora regulation','payment system','fraud','money laundering','swift','financial regulator','fdic','occ','financial crime','crypto exchange','defi','trading platform','market manipulation','financial data breach','pci dss','card skimming','atm fraud','wire transfer','financial compliance'],
  training: ['strength','workout','exercise','fitness','lifting','muscle','wrestling','running','athlete','nutrition','protein','creatine','recovery','sleep','injury','cardio','endurance','sport','coach','gym','crossfit','powerlifting','marathon','diet','supplement','health','stamina','agility','mobility','flexibility','conditioning','periodization','vo2','lactate','grappling','combat','mma','weight class','cut weight','bulk','lean'],
  mw:       ['invest','stock','market','fund','etf','401k','ira','retirement','portfolio','dividend','bond','yield','inflation','interest rate','federal reserve','economy','recession','wealth','savings','budget','debt','mortgage','financial','money','asset','equity','sp500','nasdaq','dow','crypto','bitcoin','treasury','earning','revenue','profit','loss','compound','index fund','vanguard','fidelity','schwab','roth','social security','pension','estate','tax','capital gain','rebalance','allocation','loan','credit','bankruptcy','gold','oil','crude','bullish','bearish','rally','share','quarter','rate cut','rate hike','gdp','jobs report','unemployment','payroll','housing','home price','rent','dollar','euro','currency','hedge','short selling','options','futures','commodity','real estate','net worth','cash flow','annuity','mutual fund'],
  ai:       ['artificial intelligence','machine learning','llm','large language model','gpt','claude','gemini','openai','anthropic','deepmind','transformer','neural network','deep learning','model','inference','training data','fine-tuning','rag','retrieval','embedding','agent','agentic','multimodal','diffusion','generative','ai model','benchmark','hugging face','mistral','llama','copilot','ai safety','alignment','hallucination','prompt','token','context window','ai tool','foundation model'],
  ltc:      ['python','scripting','coding','programming','tutorial','learn','developer','api','sdk','library','framework','function','debug','script','automation','bash','shell','git','github','jupyter','notebook','pandas','numpy','flask','django','fastapi','sql','database','regex','cli','claude code','anthropic','prompt engineering','langchain','openai','code review','deploy','docker','kubernetes','devops','javascript','typescript','react','node','css','html','software engineer','open source','ai agent','llm','rag','machine learning','data science','algorithm','data structure','web dev','backend','frontend','build','architecture','technical','stack overflow','compiler','runtime','async','pipeline','model','inference'],
  diy:      ['repair','replace','fix','install','maintenance','inspect','clean','seal','caulk','paint','plumb','electric','hvac','furnace','filter','gutter','roof','leak','drain','pipe','insulation','attic','basement','crawl','drywall','floor','tile','grout','deck','fence','lawn','garden','irrigation','pest','mold','moisture','ventilation','water heater','sump pump','chimney','fireplace','garage','door','window','weatherstrip','foundation','driveway','siding','shingle','framing','concrete','pressure wash','stain','primer','clog','toilet','faucet','circuit','breaker','outlet','switch','home improvement','diy','build','yard','pool','radiator','cost guide','renovation','remodel','project','material','contractor','power tool','lumber','hardware','flooring','cabinet','kitchen','bathroom','plumbing','wiring','insulate','exterior','interior','landscaping','sprinkler','hvac system','heating','cooling','appliance','weatherize'],
  tv:       ['national park','state park','road trip','us destination','american','united states','family adventure','hiking trail','waterfall','beach','mountain','canyon','city guide','things to do','day trip','weekend getaway','camping','family vacation','theme park','disney','kids travel','hidden gem','scenic drive','outdoor adventure','travel with kids','best places in','southern','midwest','northeast','southwest','pacific northwest','appalachian','smoky mountains','yellowstone','grand canyon','zion','yosemite','acadia','outer banks','florida','texas','colorado','tennessee','arizona','utah','maine','carolina'],
  golf:     ['golf','course','fairway','tee','birdie','eagle','bogey','par','pga','lpga','driver','iron','wedge','putter','handicap','green','bunker','round of golf','golf trip','golf resort','golf course','links','augusta','masters','open championship','ryder cup','equipment','swing','lesson','golf travel','golf tips'],
  cissp:    ['cissp','isc2','risk management','governance','cryptography','encryption','pki','certificate','access control','identity','authentication','authorization','incident response','security architecture','asset management','vulnerability','security assessment','penetration test','audit','compliance','nist','iso 27001','gdpr','sox','security policy','data classification','bcdr','business continuity','disaster recovery','security awareness','privilege','zero trust','iam','soc','security operations','threat modeling','secure sdlc','application security'],
};

// Tabs that REQUIRE at least 1 keyword match to show an article (strict mode)
const STRICT_TABS = new Set(['hc','training']);

// ── PODCAST DATA (static shows + working rss feeds) ───────────────────────
const PODS_STATIC = {
  it: [
    {icon:'🎙',label:'Tech News',name:'Wired Podcast',desc:'Wired editors break down the biggest technology stories — AI, cloud, enterprise tech, policy.',url:'https://www.wired.com/podcasts/',rss:null},
    {icon:'🤖',label:'AI & Cloud',name:'Lex Fridman Podcast',desc:'Long-form interviews with leading AI researchers, engineers, and technology executives.',url:'https://lexfridman.com/podcast/',rss:null},
    {icon:'☁️',label:'Cloud Security',name:'Google Cloud Security Podcast',desc:'Cloud security architecture, IAM, DevSecOps, and enterprise cloud practices.',url:'https://cloud.withgoogle.com/cloudsecurity/podcast/',rss:null},
    {icon:'🚀',label:'DevOps',name:'Ship It! (Changelog)',desc:'DevOps, infrastructure, Kubernetes, and platform engineering conversations.',url:'https://changelog.com/shipit',rss:null},
  ],
  net: [
    {icon:'🌐',label:'Networking Deep Dive',name:'Packet Pushers Heavy Networking',desc:'BGP, SDN, SD-WAN, microsegmentation — technical networking from practitioners. Perfect for SE work.',url:'https://packetpushers.net/podcast/heavy-networking/',rss:'https://feeds.packetpushers.net/PacketPushersWeeklyPodcast/'},
    {icon:'🔒',label:'Zero Trust',name:'Zero Trust Security Podcast',desc:'Zero trust architecture, microsegmentation, and identity-first network design.',url:'https://www.illumio.com/resource-center/podcasts',rss:null},
    {icon:'🛡️',label:'Network Security',name:'Security Now',desc:'Steve Gibson on TLS, encryption, network protocols and architecture — great depth on network security.',url:'https://twit.tv/shows/security-now',rss:null},
    {icon:'📡',label:'Network Engineering',name:'Network Collective',desc:'Routing, switching, architecture, and the future of enterprise networking from working engineers.',url:'https://networkcollective.com/podcast/',rss:null},
  ],
  sec: [
    {icon:'🔐',label:'InfoSec',name:'Risky Business',desc:'Weekly infosec news and practitioner interviews. The gold standard for staying current on threats.',url:'https://risky.biz',rss:'https://risky.biz/feeds/risky-business/'},
    {icon:'🕵️',label:'True Crime Cyber',name:'Darknet Diaries',desc:'True stories from the dark side — hacks, breaches, nation-state attacks, and cybercrime.',url:'https://darknetdiaries.com',rss:'https://podcast.darknetdiaries.com/'},
    {icon:'📻',label:'Daily Brief',name:'CyberWire Daily',desc:'Daily 20-min briefing on the top cybersecurity stories. Perfect commute listen.',url:'https://thecyberwire.com/podcasts/daily-podcast',rss:null},
    {icon:'🧠',label:'Threat Intel',name:'SANS Internet Stormcast',desc:'Daily 5-min threat intel from SANS ISC handlers — CVEs, active exploits, and emerging threats.',url:'https://isc.sans.edu/podcast.html',rss:null},
  ],
  ot: [
    {icon:'🔐',label:'InfoSec',name:'Risky Business',desc:'Regular ICS/OT and critical infrastructure security coverage alongside broader infosec news.',url:'https://risky.biz',rss:'https://risky.biz/feeds/risky-business/'},
    {icon:'🕵️',label:'ICS/OT Stories',name:'Darknet Diaries',desc:'Episodes on industrial attacks, critical infrastructure incidents, and SCADA-specific breaches.',url:'https://darknetdiaries.com',rss:'https://podcast.darknetdiaries.com/'},
    {icon:'🏛️',label:'Federal/CISA',name:'Grounded in CISA',desc:'Official CISA podcast — ICS-CERT advisories, critical infrastructure threats, and federal guidance.',url:'https://www.cisa.gov/news-events/podcasts',rss:null},
    {icon:'⚙️',label:'OT/IoT',name:'The Industrial Security Podcast',desc:'Claroty\'s podcast on OT/ICS/IoT security with practitioner interviews and incident analysis.',url:'https://claroty.com/resources/podcasts',rss:null},
  ],
  hc: [
    {icon:'🔐',label:'InfoSec',name:'Risky Business',desc:'Frequent healthcare sector breach coverage, ransomware hospital incidents, and vendor analysis.',url:'https://risky.biz',rss:'https://risky.biz/feeds/risky-business/'},
    {icon:'🕵️',label:'Healthcare Incidents',name:'Darknet Diaries',desc:'True stories from hospital breaches and healthcare-specific cybercrime cases.',url:'https://darknetdiaries.com',rss:'https://podcast.darknetdiaries.com/'},
    {icon:'🏥',label:'Healthcare IT',name:'HIMSS Podcasts',desc:'Healthcare IT security, HIPAA compliance, medical device vulnerabilities, and health system resilience.',url:'https://www.himss.org/podcasts',rss:null},
    {icon:'🏦',label:'FinSec/Healthcare',name:'BankInfoSecurity Podcast',desc:'ISMG covers healthcare sector threats heavily alongside financial security — HC3-relevant content.',url:'https://www.bankinfosecurity.com/podcasts',rss:null},
  ],
  fin: [
    {icon:'🏦',label:'FinSec',name:'BankInfoSecurity Podcast',desc:'ISMG\'s flagship podcast covering financial sector threats, fraud, and regulatory updates.',url:'https://www.bankinfosecurity.com/podcasts',rss:null},
    {icon:'🔐',label:'InfoSec',name:'Risky Business',desc:'Frequent coverage of financial sector breaches, SEC enforcement, and regulatory action.',url:'https://risky.biz',rss:'https://risky.biz/feeds/risky-business/'},
    {icon:'📊',label:'FS-ISAC',name:'FS-ISAC Podcast',desc:'Financial Services ISAC content on sector-specific threat intelligence and resilience.',url:'https://www.fsisac.com/resources/podcast',rss:null},
    {icon:'💳',label:'Fintech',name:'Fintech Insider',desc:'11:FS covers fintech trends, open banking, and finance/technology intersection.',url:'https://11fs.com/insights/podcasts',rss:null},
  ],
  training: [
    {icon:'🏋️',label:'Strength',name:'Juggernaut Training Systems',desc:'Chad Wesley Smith on programming, periodization, and strength for combat sports athletes.',url:'https://www.jtsstrength.com/podcasts/',rss:null},
    {icon:'🏃',label:'Running',name:'Strength Running Podcast',desc:'Jason Fitzgerald on running periodization, injury prevention, and XC/wrestling hybrid training.',url:'https://www.strengthrunning.com/category/podcast/',rss:null},
    {icon:'🤼',label:'Wrestling',name:'FloWrestling Radio Live',desc:'Wrestling news, recruiting, tournament previews, technique breakdowns, college wrestling.',url:'https://www.flowrestling.org/podcasts',rss:null},
    {icon:'💪',label:'Strength Science',name:'RP Strength Podcast',desc:'Dr. Mike Israetel on hypertrophy, nutrition timing, and evidence-based training.',url:'https://rpstrength.com/rp-strength-podcast/',rss:null},
    {icon:'🔬',label:'Recovery & Science',name:'Huberman Lab',desc:'Sleep, recovery, nutrition protocols, and neuroscience of performance. Great for athlete recovery stack.',url:'https://hubermanlab.com/podcast/',rss:'https://feeds.megaphone.fm/hubermanlab'},
    {icon:'🧬',label:'Nutrition Science',name:'Found My Fitness (Rhonda Patrick)',desc:'Deep dives on creatine, omega-3s, nutrition science — directly applicable to supplement decisions.',url:'https://www.foundmyfitness.com/podcast',rss:null},
    {icon:'🧠',label:'Wrestling Mindset',name:'Wrestle & Flow',desc:'Mental performance, mindset, and competitive edge for wrestlers at all levels.',url:'https://podcasts.apple.com/us/podcast/wrestle-flow/id1484089817',rss:null},
  ],

  mw: [
    {icon:'💰',label:'Personal Finance',name:'Planet Money (NPR)',desc:'NPR explains complex economic and financial stories in an entertaining, accessible way.',url:'https://www.npr.org/podcasts/510289/planet-money',rss:'https://feeds.npr.org/510289/podcast.xml'},
    {icon:'📈',label:'Investing',name:'Motley Fool Money',desc:'Weekly investing news, stock picks, and market analysis from the Motley Fool team.',url:'https://www.fool.com/podcasts/motley-fool-money/',rss:null},
    {icon:'🏦',label:'Retirement',name:'Retirement Answer Man',desc:'Roger Whitney covers retirement planning, Social Security, RMDs, and income strategies.',url:'https://www.rogerwhitney.com/retirementanswerman/',rss:null},
    {icon:'📊',label:'Markets',name:'Bloomberg Surveillance',desc:'Daily markets coverage with top economists, investors, and policymakers.',url:'https://www.bloomberg.com/podcasts/surveillance',rss:null},
    {icon:'🧮',label:'Financial Independence',name:'ChooseFI',desc:'Financial independence, index investing, tax optimization, and early retirement strategies.',url:'https://www.choosefi.com/podcast/',rss:null},
    {icon:'🎯',label:'Wealth Building',name:'We Study Billionaires',desc:'Deep dives into how the world\'s most successful investors think and build wealth.',url:'https://www.theinvestorspodcast.com/',rss:null},
  ],
  ai: [
    {icon:'🤖',label:'AI Research',name:'Lex Fridman Podcast',desc:'Long-form interviews with AI researchers, engineers, and founders — OpenAI, Anthropic, DeepMind, and more.',url:'https://lexfridman.com/podcast/',rss:null},
    {icon:'📊',label:'ML Explained',name:'The TWIML AI Podcast',desc:'This Week in Machine Learning covers cutting-edge ML research and applications with practitioners.',url:'https://twimlai.com/podcast/twimlai/',rss:null},
    {icon:'🔬',label:'AI Safety',name:'80,000 Hours Podcast',desc:'Deep dives on AI safety, alignment, and the long-term implications of advanced AI systems.',url:'https://80000hours.org/podcast/',rss:null},
    {icon:'🚀',label:'Builders',name:'Latent Space Podcast',desc:'AI engineers building products — covers Claude, GPT-4, open-source models, and real-world AI applications.',url:'https://www.latent.space/podcast',rss:null},
    {icon:'💡',label:'AI Business',name:'No Priors',desc:'Sarah Guo and Elad Gil interview AI founders and investors on what they are building and why.',url:'https://www.no-priors.com/',rss:null},
  ],
  ltc: [
    {icon:'🐍',label:'Python',name:'Talk Python To Me',desc:'Michael Kennedy interviews Python experts on libraries, frameworks, tools, and best practices.',url:'https://talkpython.fm/',rss:null},
    {icon:'💻',label:'Dev Skills',name:'Syntax FM',desc:'Wes Bos and Scott Tolinski on web development, JavaScript, APIs, tooling, and career growth.',url:'https://syntax.fm/',rss:null},
    {icon:'🤖',label:'Claude & API',name:'Anthropic (YouTube)',desc:'Official tutorials on prompt engineering, Claude API, tool use, and building AI-powered applications.',url:'https://www.youtube.com/@Anthropic',rss:null},
    {icon:'🔧',label:'Scripting',name:'Command Line Heroes',desc:'Red Hat\'s series on the history and future of coding, scripting, open source, and developer culture.',url:'https://www.redhat.com/en/command-line-heroes',rss:null},
    {icon:'📚',label:'ML Mastery',name:'Practical AI',desc:'Practical applications of AI and ML — covers APIs, libraries, Python tools, and real-world projects.',url:'https://changelog.com/practicalai',rss:null},
  ],


  diy: [
    {icon:'🔨',label:'DIY & Repair',name:'The Money Pit Home Improvement Show',desc:'Tom Kraeutler covers home repairs, maintenance, and improvement projects — practical answers to real homeowner questions.',url:'https://www.moneypit.com/podcast',rss:null},
    {icon:'🏠',label:'Home Maintenance',name:"Today's Homeowner Podcast",desc:'Danny Lipford answers common home maintenance questions with expert tips on repairs, upgrades, and seasonal upkeep.',url:'https://todayshomeowner.com/podcast/',rss:null},
    {icon:'🪚',label:'How-To',name:'Family Handyman Podcast',desc:'Step-by-step guidance on home repairs and DIY projects from the editors of Family Handyman magazine.',url:'https://www.familyhandyman.com/podcast/',rss:null},
    {icon:'🔧',label:'Trades & Craft',name:'Ask This Old House',desc:'Licensed contractors answer homeowner questions on plumbing, electrical, HVAC, and structural repairs.',url:'https://www.thisoldhouse.com/ask-this-old-house',rss:null},
  ],
  tv: [
    {icon:'✈️',label:'Family Travel',name:'Zero to Travel',desc:'Jason Moore covers budget travel, family adventures, slow travel, and destination deep dives.',url:'https://zerototravel.com/podcast/',rss:null},
    {icon:'🌍',label:'Adventure',name:'The Adventure Travel Podcast',desc:'Inspiring travel stories and destination guides for families and adventure seekers.',url:'https://www.adventuretravelpodcast.com/',rss:null},
    {icon:'🏖️',label:'Destinations',name:'Condé Nast Traveler Podcast',desc:'Expert recommendations on the world\'s best hotels, restaurants, and destinations.',url:'https://www.cntraveler.com/podcasts',rss:null},
    {icon:'💼',label:'Trip Planning',name:'Nomadic Matt\'s Podcast',desc:'Budget travel tips, destination guides, and stories from one of the world\'s most popular travel bloggers.',url:'https://www.nomadicmatt.com/travel-blog/',rss:null},
  ],
  golf: [
    {icon:'⛳',label:'Golf Tips',name:'No Laying Up',desc:'Deep golf conversation covering tour events, course strategy, equipment, and golf travel.',url:'https://nolayingup.com/podcast/',rss:null},
    {icon:'🏌️',label:'Instruction',name:'Golf Science Lab',desc:'Science-backed approach to improving your game — swing mechanics, putting, mental game.',url:'https://golfsciencelab.com/podcast/',rss:null},
    {icon:'🗺️',label:'Golf Travel',name:'Golf Advisor Podcast',desc:'Golf course reviews, top destination rankings, and trip planning advice for golf travelers.',url:'https://www.golfadvisor.com/',rss:null},
    {icon:'📺',label:'Tour News',name:'Fairways of Life',desc:'Weekly PGA Tour wrap-up, player interviews, and discussion of the biggest stories in golf.',url:'https://www.fairwaysoflife.com/',rss:null},
    {icon:'🏌️',label:'Improvement',name:'Chasing Scratch',desc:'Two average golfers on a mission to go from bogey to scratch — relatable, honest, and genuinely useful for the aspiring golfer.',url:'https://www.chasingscratch.com/',rss:null},
  ],
  cissp: [
    {icon:'🎓',label:'All Domains',name:'CISSP Cyber Training Podcast',desc:'Sean Gerber covers all 8 CISSP domains episode by episode.',url:'https://cissp.cybertraining365.com/podcast/',rss:null},
    {icon:'🗺️',label:'Domain Deep Dives',name:'Destination Certification',desc:'Rob Witcher\'s mind map series — one video per domain. Exceptional for visual learners.',url:'https://www.youtube.com/@DestinationCertification',rss:null},
    {icon:'🔐',label:'Domains 3 & 4',name:'Risky Business',desc:'Deep cryptography and network security content maps to CISSP Domains 3 and 4.',url:'https://risky.biz',rss:'https://risky.biz/feeds/risky-business/'},
    {icon:'📻',label:'Domain 1',name:'CyberWire Daily',desc:'Keeps risk management and current threat landscape fresh with minimal time cost.',url:'https://thecyberwire.com/podcasts/daily-podcast',rss:null},
    {icon:'🕵️',label:'Domain 7',name:'Darknet Diaries',desc:'Real incident case studies reinforce Domain 7 (Security Operations).',url:'https://darknetdiaries.com',rss:'https://podcast.darknetdiaries.com/'},
  ]

};

// ── HELPERS ───────────────────────────────────────────────────────────────
// Parse feed HTML in an inert document: nothing loads, no handlers run.
function stripHtml(h){try{return new DOMParser().parseFromString(String(h||''),'text/html').body.textContent||''}catch{return ''}}
// Escape any feed-supplied text before it goes into innerHTML.
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// Only allow http(s) links from feeds; anything else becomes '#'.
function safeUrl(u){try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:'#'}catch{return '#'}}

// ── FEED LOADER: cache + concurrency limit + rate-limit backoff ───────────
// rss2json's free tier rate-limits bursts, so: reuse results for 30 min,
// share in-flight requests, run at most 3 at a time, and stop calling it
// for 5 min once it says we're rate-limited.
const FEED_TTL = 30*60*1000, RL_COOLDOWN = 5*60*1000, FEED_MAX_PARALLEL = 3;
const feedInflight = new Map();
let feedActive = 0; const feedQueue = [];
let rateLimitedUntil = 0;
function isRateLimited(){return Date.now() < rateLimitedUntil}
function feedCacheGet(url){try{const v=JSON.parse(localStorage.getItem('mcgrid_feed_'+url)||'null');return v&&Array.isArray(v.items)?v:null}catch{return null}}
function feedCacheSet(url,items){try{localStorage.setItem('mcgrid_feed_'+url,JSON.stringify({t:Date.now(),items}))}catch{}}
function feedSlot(){return new Promise(res=>{if(feedActive<FEED_MAX_PARALLEL){feedActive++;res()}else feedQueue.push(res)})}
function feedRelease(){const n=feedQueue.shift();if(n)n();else feedActive--}
async function feedNetwork(url){
  await feedSlot();
  try{
    if(isRateLimited()) throw new Error('rate-limited');
    const r = await fetch(`${API}${encodeURIComponent(url)}`);
    let d=null; try{d=await r.json()}catch{}
    const msg = (d&&d.message)||'';
    if(r.status===429 || /short period|api key|rate/i.test(msg)){
      rateLimitedUntil = Date.now()+RL_COOLDOWN; throw new Error('rate-limited');
    }
    if(!d||d.status!=='ok'||!Array.isArray(d.items)) throw new Error('bad feed');
    // keep only what the page uses, as plain text, so the cache stays small
    const items = d.items.slice(0,10).map(i=>({
      title: stripHtml(i.title||''),
      link: i.link||'',
      pubDate: i.pubDate||'',
      description: stripHtml(i.description||i.content||'').slice(0,400)
    }));
    feedCacheSet(url,items);
    return items;
  } finally { feedRelease() }
}
// Returns plain-text items ([] if nothing). force=true skips a fresh cache (Refresh button).
async function getFeedItems(url, force=false){
  const c = feedCacheGet(url);
  if(c && !force && Date.now()-c.t < FEED_TTL) return c.items;
  if(isRateLimited()) return c ? c.items : [];
  if(!feedInflight.has(url)){
    feedInflight.set(url, feedNetwork(url).catch(()=>null).finally(()=>feedInflight.delete(url)));
  }
  const items = await feedInflight.get(url);
  return items || (c ? c.items : []);
}
const RL_MSG = 'The news feed service is rate-limiting this page. Showing what was saved; try again in a few minutes.';
function fmtDate(s){if(!s)return'';if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s))s=s.replace(' ','T')+'Z';const d=new Date(s);return isNaN(d)?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}

function skeleton(){
  return `<div class="grid">`+Array(6).fill(0).map(()=>`
    <div class="sk-card">
      <div class="sk-line s"></div><div class="sk-line"></div>
      <div class="sk-line m"></div><div class="sk-line m"></div>
      <div class="sk-line t"></div>
    </div>`).join('')+`</div>`;
}

// ── FETCH NEWS ────────────────────────────────────────────────────────────
async function fetchFeed(url, label, force=false){
  try{
    const items = await getFeedItems(url, force);
    return items.map(i=>({
      headline: esc(i.title||'Untitled'),
      summary:  esc(String(i.description||'').slice(0,220)),
      link:     esc(safeUrl(i.link)),
      source:   esc(label),
      date:     esc(fmtDate(i.pubDate))
    }));
  }catch{return []}
}

// Keyword matching: a keyword must begin at the start of a word ("sport" no
// longer matches "transport"); keywords of 4 chars or fewer must be a whole
// word (optionally plural), so "par" doesn't match "part" or "tee" "teen".
// Longer keywords still match as prefixes ("invest" -> "investing").
const KW_RE = {};
for (const [tab, list] of Object.entries(KEYWORDS)) {
  KW_RE[tab] = [...new Set(list.map(k => k.toLowerCase()))].map(k => {
    const e = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tail = k === 'apt' ? '(?:s|\\d+)?(?![a-z0-9])'
               : /[a-z0-9]$/.test(k) && k.length <= 4 ? 's?(?![a-z0-9])' : '';
    return new RegExp('(?:^|[^a-z0-9])' + e + tail);
  });
}
function kwScore(text, tab){
  const res = KW_RE[tab]; if(!res) return 0;
  const txt = String(text||'').toLowerCase();
  let n = 0; for (const re of res) if (re.test(txt)) n++;
  return n;
}
function scoreItem(item, tab){
  if(!KEYWORDS[tab]) return 1;
  return kwScore((item.headline+' '+item.summary).replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"'), tab);
}

async function fetchPanel(key, force=false){
  const btn = document.querySelector(`.fetch-btn[data-panel="${key}"]`);
  btn.classList.add('loading'); btn.disabled=true;
  document.getElementById('cards-'+key).innerHTML = skeleton();
  try{
    const feeds = NEWS_FEEDS[key];
    const all = await Promise.all(feeds.map(f=>fetchFeed(f.url,f.label,force)));
    let items = all.flat();
    // dedupe by headline
    const seen = new Set();
    items = items.filter(i=>{if(seen.has(i.headline))return false;seen.add(i.headline);return true});
    // strict tabs: REQUIRE at least 1 keyword match — no bleed-through from other categories
    if(STRICT_TABS.has(key) && KEYWORDS[key]) {
      items = items.filter(i => scoreItem(i, key) > 0);
    }
    // tab-specific blocklists — exclude irrelevant topics
    const BLOCKLIST = {
      diy: ['pool','swimming pool','above-ground pool','pool vacuum','pool debris'],
      tv:  ['credit card','travel card','travel rewards','miles card','points card','gear review','best luggage','best backpack','travel insurance','travel pillow','travel adapter','travel hack','cheap flight','airline miles','frequent flyer','loyalty program','travel credit','card review','best card for travel','travel wallet','best airbnb','best airbnbs','airbnb in','vrbo','vacation rental','best hotels in','best resorts in','best hostels','where to stay in','places to stay'],
    };
    if(BLOCKLIST[key]) {
      items = items.filter(i => {
        const txt = (i.headline + ' ' + i.summary).toLowerCase();
        return !BLOCKLIST[key].some(b => txt.includes(b));
      });
    }
    // sort by keyword relevance score (highest first)
    if(KEYWORDS[key]) items.sort((a,b)=>scoreItem(b,key)-scoreItem(a,key));
    items = items.slice(0,9);
    const accent = {it:'var(--ca)',net:'var(--na)',sec:'var(--sea)',ot:'var(--oa)',hc:'var(--hca)',fin:'var(--fa)',training:'var(--ta)',mw:'var(--mwa)',ai:'var(--aia)',ltc:'var(--ltca)',diy:'var(--diya)',tv:'var(--tva)',golf:'var(--ga)',cissp:'var(--csa)'}[key];
    const tag = {it:'IT & Tech',net:'Networking',sec:'Cybersecurity',ot:'Industrial OT',hc:'Healthcare',fin:'Finance & Reg',training:'Training',mw:'Money & Markets',ai:'AI & Dev',ltc:'Learn to Code',diy:'Home & DIY',tv:'Travel',golf:'Golf',cissp:'CISSP'}[key];
    if(!items.length){
      document.getElementById('cards-'+key).innerHTML=`<div class="state-box"><span class="si">⚠️</span><p>${isRateLimited()?"The news feed service is rate-limiting this page. Try again in a few minutes.":"Couldn't load feeds. Try again in a moment."}</p></div>`;
    } else {
      document.getElementById('cards-'+key).innerHTML =
        (isRateLimited()?`<div class="fc" style="margin-bottom:12px">${RL_MSG}</div>`:'')+
        `<div class="grid">`+
        items.map(i=>`
          <a class="nc" href="${i.link}" target="_blank" rel="noopener" style="--ac:${accent}">
            <div class="ct">${tag}</div>
            <div class="ch">${i.headline}</div>
            <div class="cs">${i.summary}</div>
            <div class="cm"><div class="csrc">${i.source}</div><div class="cdt">${i.date}</div></div>
          </a>`).join('')+
        `</div><div class="fc">click any card to read full article</div>`;
    }
  }catch(e){
    document.getElementById('cards-'+key).innerHTML=`<div class="state-box"><span class="si">⚠️</span><p>Something went wrong. Try again.<br><small>${esc(e.message)}</small></p></div>`;
  }finally{
    btn.classList.remove('loading'); btn.disabled=false;
    btn.querySelector('.bl').textContent='Refresh';
  }
}

// ── PODCASTS ──────────────────────────────────────────────────────────────
function renderStaticPods(key){
  const accent = {it:'var(--ca)',net:'var(--na)',sec:'var(--sea)',ot:'var(--oa)',hc:'var(--hca)',fin:'var(--fa)',training:'var(--ta)',mw:'var(--mwa)',ai:'var(--aia)',ltc:'var(--ltca)',diy:'var(--diya)',tv:'var(--tva)',golf:'var(--ga)',cissp:'var(--csa)'}[key];
  return `<div class="grid">`+
    PODS_STATIC[key].map(p=>`
      <a class="pc" href="${p.url}" target="_blank" rel="noopener" style="--ac:${accent}">
        <div class="pi">${p.icon}</div>
        <div class="pb">
          <div class="pl">${p.label}</div>
          <div class="pn">${p.name}</div>
          <div class="pd">${p.desc}</div>
        </div>
      </a>`).join('')+`</div>`;
}

async function fetchPodEpisodes(key){
  const accent = {it:'var(--ca)',net:'var(--na)',sec:'var(--sea)',ot:'var(--oa)',hc:'var(--hca)',fin:'var(--fa)',training:'var(--ta)',mw:'var(--mwa)',ai:'var(--aia)',ltc:'var(--ltca)',diy:'var(--diya)',tv:'var(--tva)',golf:'var(--ga)',cissp:'var(--csa)'}[key];
  const pods = PODS_STATIC[key].filter(p=>p.rss);
  if(!pods.length) return {html: renderStaticPods(key), live: false};
  const results = await Promise.all(pods.map(async p=>{
    try{
      const items = await getFeedItems(p.rss, true);
      return items.slice(0,2).map(i=>({
        show:p.name, icon:p.icon, label:p.label,
        title:esc(i.title||'Episode'),
        desc:esc(String(i.description||'').slice(0,160)),
        link:esc(i.link?safeUrl(i.link):p.url),
        date:esc(fmtDate(i.pubDate))
      }));
    }catch{return []}
  }));
  const eps = results.flat();
  if(!eps.length) return {html: renderStaticPods(key), live: false};
  return {live: true, html: `<div class="grid">`+
    eps.map(e=>`
      <a class="epc" href="${e.link}" target="_blank" rel="noopener" style="--ac:${accent}">
        <div class="es">${e.icon} ${e.show} · ${e.label}</div>
        <div class="et">${e.title}</div>
        <div class="ed">${e.desc}</div>
        <div class="em">${e.date}</div>
      </a>`).join('')+`</div>`};
}


// ── HOME PAGE ──────────────────────────────────────────────────────────────


const QUOTES = [
  // Leadership & Excellence
  {t:"The best way to predict the future is to create it.",a:"Peter Drucker"},
  {t:"Management is doing things right; leadership is doing the right things.",a:"Peter Drucker"},
  {t:"What gets measured gets managed.",a:"Attributed to Peter Drucker"},
  {t:"The most dangerous kind of waste is the waste we do not recognize.",a:"Shigeo Shingo"},
  {t:"Leaders eat last.",a:"Simon Sinek"},
  {t:"Start with why.",a:"Simon Sinek"},
  {t:"The purpose of a business is to create and keep a customer.",a:"Peter Drucker"},
  {t:"Culture eats strategy for breakfast.",a:"Peter Drucker"},
  {t:"Good is the enemy of great.",a:"Jim Collins"},
  {t:"First who, then what.",a:"Jim Collins"},
  {t:"Greatness is not a function of circumstance. It is a matter of conscious choice.",a:"Jim Collins"},
  {t:"The secret of getting ahead is getting started.",a:"Attributed to Mark Twain"},
  {t:"It is not the strongest of the species that survive, but the one most responsive to change.",a:"Charles Darwin"},
  {t:"The measure of intelligence is the ability to change.",a:"Attributed to Albert Einstein"},
  {t:"In the middle of every difficulty lies opportunity.",a:"Attributed to Albert Einstein"},
  {t:"Imagination is more important than knowledge.",a:"Albert Einstein"},
  {t:"A person who never made a mistake never tried anything new.",a:"Attributed to Albert Einstein"},
  {t:"Logic will get you from A to B. Imagination will take you everywhere.",a:"Attributed to Albert Einstein"},
  {t:"The definition of insanity is doing the same thing over and over and expecting different results.",a:"Narcotics Anonymous (1981), often credited to Einstein"},
  {t:"Try not to become a man of success, but rather try to become a man of value.",a:"Albert Einstein"},
  // Discipline & Hard Work
  {t:"Discipline is the bridge between goals and accomplishment.",a:"Jim Rohn"},
  {t:"Either you run the day or the day runs you.",a:"Jim Rohn"},
  {t:"We must all suffer one of two things: the pain of discipline or the pain of regret.",a:"Jim Rohn"},
  {t:"Success is nothing more than a few simple disciplines practiced every day.",a:"Jim Rohn"},
  {t:"Take care of your body. It's the only place you have to live.",a:"Jim Rohn"},
  {t:"Formal education will make you a living; self-education will make you a fortune.",a:"Jim Rohn"},
  {t:"Work harder on yourself than you do on your job.",a:"Jim Rohn"},
  {t:"Don't wish it were easier. Wish you were better.",a:"Jim Rohn"},
  {t:"You don't get paid for the hour. You get paid for the value you bring to the hour.",a:"Jim Rohn"},
  {t:"Hard work beats talent when talent doesn't work hard.",a:"Tim Notke"},
  {t:"The only way to do great work is to love what you do.",a:"Steve Jobs"},
  {t:"Your time is limited, so don't waste it living someone else's life.",a:"Steve Jobs"},
  {t:"Stay hungry, stay foolish.",a:"Steve Jobs"},
  {t:"Innovation distinguishes between a leader and a follower.",a:"Steve Jobs"},
  {t:"Simplicity is the ultimate sophistication.",a:"Leonardo da Vinci"},
  {t:"The secret of success is constancy of purpose.",a:"Benjamin Disraeli"},
  {t:"An investment in knowledge pays the best interest.",a:"Benjamin Franklin"},
  {t:"Either write something worth reading or do something worth writing.",a:"Benjamin Franklin"},
  {t:"Energy and persistence conquer all things.",a:"Benjamin Franklin"},
  // Athletic Performance & Wrestling
  {t:"Champions aren't made in gyms. Champions are made from something they have deep inside them.",a:"Muhammad Ali"},
  {t:"It's not bragging if you can back it up.",a:"Muhammad Ali"},
  {t:"Float like a butterfly, sting like a bee.",a:"Muhammad Ali"},
  {t:"I hated every minute of training, but I said don't quit. Suffer now and live the rest of your life as a champion.",a:"Muhammad Ali"},
  {t:"The fight is won or lost far away from witnesses — behind the lines, in the gym, and out there on the road.",a:"Muhammad Ali"},
  {t:"Impossible is just a word thrown around by small men who find it easier to live in the world they've been given.",a:"Muhammad Ali"},
  {t:"What keeps me going is goals.",a:"Muhammad Ali"},
  {t:"Don't count the days; make the days count.",a:"Muhammad Ali"},
  {t:"Strength does not come from winning. Your struggles develop your strengths.",a:"Arnold Schwarzenegger"},
  {t:"The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it.",a:"Arnold Schwarzenegger"},
  {t:"Reps, reps, reps. That's the only way you get there.",a:"Arnold Schwarzenegger"},
  {t:"The worst thing I can be is the same as everybody else.",a:"Arnold Schwarzenegger"},
  {t:"You can have results or excuses. Not both.",a:"Arnold Schwarzenegger"},
  {t:"Failure is not an option. Everyone has to succeed.",a:"Arnold Schwarzenegger"},
  {t:"Pain is temporary. Quitting lasts forever.",a:"Lance Armstrong"},
  {t:"You are your own worst enemy, and once you can conquer yourself, you can conquer anything.",a:"Dan Gable"},
  {t:"Once you have wrestled, everything else in life is easy.",a:"Dan Gable"},
  {t:"The road to success is always under construction.",a:"Dan Gable"},
  {t:"Gold medals aren't really made of gold. They're made of sweat, determination, and a hard-to-find alloy called guts.",a:"Dan Gable"},
  {t:"I wrestled because I loved it and because there was something in me that had to compete.",a:"Dan Gable"},
  {t:"The more you sweat in practice, the less you bleed in battle.",a:"Unknown"},
  {t:"First master the fundamentals.",a:"Larry Bird"},
  {t:"The only place success comes before work is in the dictionary.",a:"Vince Lombardi"},
  {t:"Perfection is not attainable, but if we chase perfection we can catch excellence.",a:"Vince Lombardi"},
  {t:"Winners never quit and quitters never win.",a:"Vince Lombardi"},
  {t:"The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack of will.",a:"Vince Lombardi"},
  {t:"It's not whether you get knocked down; it's whether you get up.",a:"Vince Lombardi"},
  {t:"Individual commitment to a group effort — that is what makes a team work.",a:"Vince Lombardi"},
  {t:"A champion is someone who gets up when they can't.",a:"Jack Dempsey"},
  {t:"You miss 100% of the shots you don't take.",a:"Wayne Gretzky"},
  {t:"Procrastination is the thief of time.",a:"Edward Young"},
  {t:"The extra mile is never crowded.",a:"Wayne Dyer"},
  {t:"Success is where preparation and opportunity meet.",a:"Bobby Unser"},
  {t:"Winning is habit. Unfortunately, so is losing.",a:"Vince Lombardi"},
  {t:"Excellence is not a singular act, but a habit.",a:"Aristotle"},
  {t:"We are what we repeatedly do. Excellence, then, is not an act but a habit.",a:"Will Durant, summarizing Aristotle"},
  {t:"It is during our darkest moments that we must focus to see the light.",a:"Attributed to Aristotle Onassis"},
  // Resilience & Persistence
  {t:"Fall seven times, stand up eight.",a:"Japanese Proverb"},
  {t:"It does not matter how slowly you go as long as you do not stop.",a:"Attributed to Confucius"},
  {t:"Our greatest glory is not in never falling, but in rising every time we fall.",a:"Oliver Goldsmith"},
  {t:"The man who moves a mountain begins by carrying away small stones.",a:"Confucius"},
  {t:"Success is not final, failure is not fatal: it is the courage to continue that counts.",a:"Attributed to Winston Churchill"},
  {t:"If you're going through hell, keep going.",a:"Attributed to Winston Churchill"},
  {t:"Continuous effort — not strength or intelligence — is the key to unlocking our potential.",a:"Attributed to Winston Churchill"},
  {t:"Success consists of going from failure to failure without loss of enthusiasm.",a:"Attributed to Winston Churchill"},
  {t:"We shall never surrender.",a:"Winston Churchill"},
  {t:"Never, never, never give up.",a:"Winston Churchill"},
  {t:"I am not a product of my circumstances. I am a product of my decisions.",a:"Stephen Covey"},
  {t:"Begin with the end in mind.",a:"Stephen Covey"},
  {t:"The key is not to prioritize what's on your schedule, but to schedule your priorities.",a:"Stephen Covey"},
  {t:"Seek first to understand, then to be understood.",a:"Stephen Covey"},
  {t:"Synergy is what happens when one plus one equals ten or a hundred.",a:"Stephen Covey"},
  {t:"To change ourselves effectively, we first had to change our perceptions.",a:"Stephen Covey"},
  {t:"Most people do not listen with the intent to understand; they listen with the intent to reply.",a:"Stephen Covey"},
  {t:"Persistence is the twin sister of excellence. One is a matter of quality; the other, a matter of time.",a:"Marabel Morgan"},
  {t:"Perseverance is not a long race; it is many short races one after the other.",a:"Walter Elliot"},
  {t:"A river cuts through rock not because of its power, but its persistence.",a:"Jim Watkins"},
  {t:"The secret of life is to fall seven times and to get up eight times.",a:"Paulo Coelho"},
  {t:"It always seems impossible until it's done.",a:"Nelson Mandela"},
  {t:"Education is the most powerful weapon which you can use to change the world.",a:"Nelson Mandela"},
  {t:"I never lose. I either win or learn.",a:"Nelson Mandela"},
  {t:"Do not judge me by my successes, judge me by how many times I fell down and got back up again.",a:"Nelson Mandela"},
  // Cybersecurity & Technology
  {t:"Security is always excessive until it's not enough.",a:"Robbie Sinclair"},
  {t:"The network perimeter is dead. Identity is the new perimeter.",a:"Unknown"},
  {t:"Amateurs hack systems, professionals hack people.",a:"Bruce Schneier"},
  {t:"Security is a process, not a product.",a:"Bruce Schneier"},
  {t:"The question is no longer if you will be breached, but when.",a:"Unknown"},
  {t:"If you think technology can solve your security problems, then you don't understand the problems and you don't understand the technology.",a:"Bruce Schneier"},
  {t:"Data is the new oil.",a:"Clive Humby"},
  {t:"The only truly secure system is one that is powered off, cast in a block of concrete and sealed in a lead-lined room with armed guards.",a:"Gene Spafford"},
  {t:"Complexity is the enemy of security.",a:"Bruce Schneier"},
  {t:"In God we trust. All others we monitor.",a:"Ronald Reagan"},
  {t:"The art of war teaches us to rely not on the likelihood of the enemy's not coming, but on our own readiness to receive him.",a:"Sun Tzu"},
  {t:"Know your enemy and know yourself and you can fight a hundred battles without disaster.",a:"Sun Tzu"},
  {t:"Move fast and break things. Unless you are a security team.",a:"Unknown"},
  {t:"Encryption works. Properly implemented strong crypto systems are one of the few things that you can rely on.",a:"Edward Snowden"},
  {t:"The internet is a reflection of our society and that mirror is going to be reflecting what we see.",a:"Vint Cerf"},
  {t:"Software is eating the world.",a:"Marc Andreessen"},
  {t:"Any sufficiently advanced technology is indistinguishable from magic.",a:"Arthur C. Clarke"},
  {t:"The advance of technology is based on making it fit in so that you don't really even notice it.",a:"Bill Gates"},
  {t:"We are stuck with technology when what we really want is just stuff that works.",a:"Douglas Adams"},
  {t:"Technology is best when it brings people together.",a:"Matt Mullenweg"},
  {t:"The real danger is not that computers will begin to think like men, but that men will begin to think like computers.",a:"Sydney J. Harris"},
  {t:"Passwords are like underwear: don't let people see it, change it very often, and you shouldn't share it with strangers.",a:"Chris Pirillo"},
  {t:"There are two types of companies: those that have been hacked, and those that don't yet know they have been hacked.",a:"John Chambers"},
  // Learning & Growth
  {t:"Live as if you were to die tomorrow. Learn as if you were to live forever.",a:"Mahatma Gandhi"},
  {t:"Be the change you wish to see in the world.",a:"Attributed to Mahatma Gandhi"},
  {t:"Strength does not come from physical capacity. It comes from an indomitable will.",a:"Mahatma Gandhi"},
  {t:"The weak can never forgive. Forgiveness is the attribute of the strong.",a:"Mahatma Gandhi"},
  {t:"The more that you read, the more things you will know.",a:"Dr. Seuss"},
  {t:"You have brains in your head. You have feet in your shoes. You can steer yourself any direction you choose.",a:"Dr. Seuss"},
  {t:"Today you are You, that is truer than true. There is no one alive who is Youer than You.",a:"Dr. Seuss"},
  {t:"Why fit in when you were born to stand out?",a:"Dr. Seuss"},
  {t:"Knowledge is power.",a:"Francis Bacon"},
  {t:"The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",a:"Brian Herbert"},
  {t:"Education is not the filling of a pail, but the lighting of a fire.",a:"William Butler Yeats"},
  {t:"The beautiful thing about learning is that no one can take it away from you.",a:"B.B. King"},
  {t:"Learning never exhausts the mind.",a:"Leonardo da Vinci"},
  {t:"Every expert was once a beginner.",a:"Helen Hayes"},
  {t:"The more I learn, the more I realize how much I don't know.",a:"Attributed to Albert Einstein"},
  {t:"You don't have to be great to start, but you have to start to be great.",a:"Zig Ziglar"},
  {t:"People often say that motivation doesn't last. Well, neither does bathing. That's why we recommend it daily.",a:"Zig Ziglar"},
  {t:"Your attitude, not your aptitude, will determine your altitude.",a:"Zig Ziglar"},
  {t:"A goal properly set is halfway reached.",a:"Zig Ziglar"},
  {t:"You were born to win, but to be a winner, you must plan to win, prepare to win, and expect to win.",a:"Zig Ziglar"},
  {t:"What you get by achieving your goals is not as important as what you become by achieving your goals.",a:"Zig Ziglar"},
  // Health, Recovery & Performance Science
  {t:"The groundwork for all happiness is good health.",a:"Leigh Hunt"},
  {t:"Health is not valued until sickness comes.",a:"Thomas Fuller"},
  {t:"The first wealth is health.",a:"Ralph Waldo Emerson"},
  {t:"A healthy outside starts from the inside.",a:"Robert Urich"},
  {t:"Sleep is the best meditation.",a:"Dalai Lama"},
  {t:"The body achieves what the mind believes.",a:"Unknown"},
  {t:"Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.",a:"John F. Kennedy"},
  {t:"Exercise is a celebration of what your body can do, not a punishment for what you ate.",a:"Unknown"},
  {t:"Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit.",a:"Ralph Marston"},
  {t:"Recovery is not a sign of weakness; it's a strategy for strength.",a:"Unknown"},
  {t:"Nutrition is not just about eating. It's about learning to live.",a:"Patricia Bragg"},
  {t:"Let food be thy medicine and medicine be thy food.",a:"Hippocrates"},
  {t:"Your body is a reflection of your lifestyle.",a:"Unknown"},
  {t:"To keep the body in good health is a duty, otherwise we shall not be able to keep our mind strong and clear.",a:"Buddha"},
  {t:"The food you eat can be either the safest and most powerful form of medicine or the slowest form of poison.",a:"Ann Wigmore"},
  {t:"Sweat is just fat crying.",a:"Unknown"},
  {t:"You don't have to be extreme, just consistent.",a:"Unknown"},
  {t:"Rome wasn't built in a day, but they were laying bricks every hour.",a:"Unknown"},
  {t:"Progressive overload is the law of adaptation.",a:"Unknown"},
  // Philosophy & Wisdom
  {t:"The unexamined life is not worth living.",a:"Socrates"},
  {t:"The only true wisdom is in knowing you know nothing.",a:"Socrates"},
  {t:"A ship in harbor is safe, but that is not what ships are for.",a:"John A. Shedd"},
  {t:"The price of anything is the amount of life you exchange for it.",a:"Henry David Thoreau"},
  {t:"Not all those who wander are lost.",a:"J.R.R. Tolkien"},
  {t:"All that is gold does not glitter.",a:"J.R.R. Tolkien"},
  {t:"Even the smallest person can change the course of the future.",a:"J.R.R. Tolkien"},
  {t:"It's a dangerous business, going out your door.",a:"J.R.R. Tolkien"},
  {t:"The two most important days in your life are the day you are born and the day you find out why.",a:"Attributed to Mark Twain"},
  {t:"Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did.",a:"Attributed to Mark Twain"},
  {t:"Courage is not the absence of fear but the judgment that something else is more important than fear.",a:"Ambrose Redmoon"},
  {t:"Everything you've ever wanted is on the other side of fear.",a:"George Addair"},
  {t:"You gain strength, courage, and confidence by every experience in which you really stop to look fear in the face.",a:"Eleanor Roosevelt"},
  {t:"No one can make you feel inferior without your consent.",a:"Eleanor Roosevelt"},
  {t:"The future belongs to those who believe in the beauty of their dreams.",a:"Eleanor Roosevelt"},
  {t:"Do what you can, with what you have, where you are.",a:"Theodore Roosevelt"},
  {t:"Believe you can and you're halfway there.",a:"Attributed to Theodore Roosevelt"},
  {t:"Nothing in life is to be feared, only to be understood.",a:"Marie Curie"},
  {t:"I have not failed. I've just found 10,000 ways that won't work.",a:"Thomas Edison"},
  {t:"Genius is one percent inspiration and ninety-nine percent perspiration.",a:"Thomas Edison"},
  {t:"There is no substitute for hard work.",a:"Thomas Edison"},
  {t:"Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.",a:"Thomas Edison"},
  // Stoicism & Mindset
  {t:"You have power over your mind — not outside events. Realize this, and you will find strength.",a:"Marcus Aurelius"},
  {t:"The impediment to action advances action. What stands in the way becomes the way.",a:"Marcus Aurelius"},
  {t:"Waste no more time arguing about what a good man should be. Be one.",a:"Marcus Aurelius"},
  {t:"Very little is needed to make a happy life; it is all within yourself, in your way of thinking.",a:"Marcus Aurelius"},
  {t:"Do not indulge in dreams of what you do not have, but count up the chief of the blessings you do have.",a:"Marcus Aurelius"},
  {t:"If it is not right, do not do it; if it is not true, do not say it.",a:"Marcus Aurelius"},
  {t:"The obstacle is the way.",a:"Ryan Holiday"},
  {t:"Ego is the enemy.",a:"Ryan Holiday"},
  {t:"Stillness is the key.",a:"Ryan Holiday"},
  {t:"Make the most of what is in your power, and take the rest as it happens.",a:"Epictetus"},
  {t:"Seek not the good in external things; seek it in yourself.",a:"Epictetus"},
  {t:"First say to yourself what you would be; and then do what you have to do.",a:"Epictetus"},
  {t:"It's not what happens to you, but how you react to it that matters.",a:"Epictetus"},
  {t:"Man is not worried by real problems so much as by his imagined anxieties about real problems.",a:"Epictetus"},
  {t:"Luck is what happens when preparation meets opportunity.",a:"Attributed to Seneca"},
  {t:"It is not that I'm so smart. But I stay with the questions much longer.",a:"Albert Einstein"},
  {t:"He who has a why to live can bear almost any how.",a:"Friedrich Nietzsche"},
  {t:"That which does not kill us makes us stronger.",a:"Friedrich Nietzsche"},
  {t:"Without music, life would be a mistake.",a:"Friedrich Nietzsche"},
  {t:"The secret for harvesting from existence the greatest fruitfulness and the greatest enjoyment is to live dangerously.",a:"Friedrich Nietzsche"},
  // Sales, Business & Execution
  {t:"Your most unhappy customers are your greatest source of learning.",a:"Bill Gates"},
  {t:"It's fine to celebrate success, but it is more important to heed the lessons of failure.",a:"Bill Gates"},
  {t:"We always overestimate the change that will occur in the next two years and underestimate the change that will occur in the next ten.",a:"Bill Gates"},
  {t:"The way to get started is to quit talking and begin doing.",a:"Walt Disney"},
  {t:"All our dreams can come true, if we have the courage to pursue them.",a:"Walt Disney"},
  {t:"It's kind of fun to do the impossible.",a:"Walt Disney"},
  {t:"You can design and create, and build the most wonderful place in the world. But it takes people to make the dream a reality.",a:"Walt Disney"},
  {t:"The difference between ordinary and extraordinary is that little extra.",a:"Jimmy Johnson"},
  {t:"Success is never owned. It's rented — and rent is due every day.",a:"Rory Vaden"},
  {t:"Do or do not. There is no try.",a:"Yoda"},
  {t:"In the long run, we only hit what we aim at.",a:"Henry David Thoreau"},
  {t:"Act as if what you do makes a difference. It does.",a:"William James"},
  {t:"The will to win is important, but the will to prepare is vital.",a:"Joe Paterno"},
  {t:"A dream doesn't become reality through magic; it takes sweat, determination and hard work.",a:"Colin Powell"},
  {t:"There are no secrets to success. It is the result of preparation, hard work, and learning from failure.",a:"Colin Powell"},
  {t:"If you're offered a seat on a rocket ship, don't ask what seat. Just get on.",a:"Sheryl Sandberg"},
  {t:"Done is better than perfect.",a:"Sheryl Sandberg"},
  {t:"In the future, there will be no female leaders. There will just be leaders.",a:"Sheryl Sandberg"},
  {t:"The biggest risk is not taking any risk. In a world that's changing quickly, the only strategy that is guaranteed to fail is not taking risks.",a:"Mark Zuckerberg"},
  {t:"Move fast and break things.",a:"Mark Zuckerberg"},
  {t:"The people who are crazy enough to think they can change the world are the ones who do.",a:"Apple 'Think Different' ad (1997)"},
  // Mentorship, Coaching & Youth Development
  {t:"A coach is someone who tells you what you don't want to hear, who has you see what you don't want to see, so you can be who you have always known you could be.",a:"Tom Landry"},
  {t:"The mediocre teacher tells. The good teacher explains. The superior teacher demonstrates. The great teacher inspires.",a:"William Arthur Ward"},
  {t:"Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",a:"Malcolm X"},
  {t:"The function of leadership is to produce more leaders, not more followers.",a:"Ralph Nader"},
  {t:"A mentor is someone who sees more talent and ability within you, than you see in yourself.",a:"Bob Proctor"},
  {t:"Tell me and I forget. Teach me and I remember. Involve me and I learn.",a:"Proverb, loosely after Xunzi"},
  {t:"The children are our future. Teach them well and let them lead the way.",a:"Whitney Houston"},
  {t:"Plant seeds of happiness, hope, success, and love; it will all come back to you in abundance.",a:"Steve Maraboli"},
  {t:"Success is not about how much money you make; it's about the difference you make in people's lives.",a:"Michelle Obama"},
  {t:"You should never view your challenges as a disadvantage. Instead, it's important for you to understand that your experience facing and overcoming adversity is actually one of your biggest advantages.",a:"Michelle Obama"},
  // Short & Punchy
  {t:"Be yourself; everyone else is already taken.",a:"Oscar Wilde"},
  {t:"To live is the rarest thing in the world. Most people exist, that is all.",a:"Oscar Wilde"},
  {t:"Always forgive your enemies; nothing annoys them so much.",a:"Oscar Wilde"},
  {t:"I can resist everything except temptation.",a:"Oscar Wilde"},
  {t:"A room without books is like a body without a soul.",a:"Marcus Tullius Cicero"},
  {t:"If you want to go fast, go alone. If you want to go far, go together.",a:"African Proverb"},
  {t:"A smooth sea never made a skilled sailor.",a:"Proverb"},
  {t:"When you reach the end of your rope, tie a knot in it and hang on.",a:"Franklin D. Roosevelt"},
  {t:"The only thing we have to fear is fear itself.",a:"Franklin D. Roosevelt"},
  {t:"The price of greatness is responsibility.",a:"Winston Churchill"},
  {t:"We make a living by what we get, but we make a life by what we give.",a:"Attributed to Winston Churchill"},
  {t:"Attitude is a little thing that makes a big difference.",a:"Winston Churchill"},
  {t:"You have enemies? Good. That means you've stood up for something, sometime in your life.",a:"Attributed to Winston Churchill"},
  {t:"Every accomplishment starts with the decision to try.",a:"John F. Kennedy"},
  {t:"Ask not what your country can do for you — ask what you can do for your country.",a:"John F. Kennedy"},
  {t:"Change is the law of life. And those who look only to the past or present are certain to miss the future.",a:"John F. Kennedy"},
  {t:"One person can make a difference and every person should try.",a:"John F. Kennedy"},
  {t:"Do something today that your future self will thank you for.",a:"Sean Patrick Flanery"},
  {t:"A year from now you will wish you had started today.",a:"Karen Lamb"},
  {t:"The best time to plant a tree was 20 years ago. The second best time is now.",a:"Chinese Proverb"},
  {t:"Small daily improvements over time lead to stunning results.",a:"Robin Sharma"},
  {t:"A 1% improvement every day compounds to a 37x improvement over a year.",a:"James Clear"},
  {t:"You do not rise to the level of your goals. You fall to the level of your systems.",a:"James Clear"},
  {t:"Every action you take is a vote for the type of person you wish to become.",a:"James Clear"},
  {t:"Habits are the compound interest of self-improvement.",a:"James Clear"},
  {t:"Success is the product of daily habits — not once-in-a-lifetime transformations.",a:"James Clear"},
  {t:"The most effective form of learning is practice, not planning.",a:"James Clear"},
  {t:"Goals are good for setting a direction, but systems are best for making progress.",a:"James Clear"},
  {t:"Be not afraid of greatness. Some are born great, some achieve greatness, and some have greatness thrust upon them.",a:"William Shakespeare"},
  {t:"All the world's a stage, and all the men and women merely players.",a:"William Shakespeare"},
  {t:"We know what we are, but know not what we may be.",a:"William Shakespeare"},
  {t:"Hell is empty and all the devils are here.",a:"William Shakespeare"},
  {t:"Courage is resistance to fear, mastery of fear, not absence of fear.",a:"Mark Twain"},
  {t:"Whenever you find yourself on the side of the majority, it is time to pause and reflect.",a:"Mark Twain"},
  {t:"If you tell the truth, you don't have to remember anything.",a:"Mark Twain"},
  {t:"Go to heaven for the climate, hell for the company.",a:"Mark Twain"},
  // Running & Endurance
  {t:"Run when you can, walk if you have to, crawl if you must; just never give up.",a:"Dean Karnazes"},
  {t:"The long run is what puts the tiger in the cat.",a:"Bill Squires"},
  {t:"I always loved running — it was something you could do by yourself, and under your own power.",a:"Jesse Owens"},
  {t:"Running is the greatest metaphor for life, because you get out of it what you put into it.",a:"Oprah Winfrey"},
  {t:"Most people never run far enough on their first wind to find out they've got a second.",a:"William James"},
  {t:"We run, not because we think it is doing us good, but because we enjoy it and cannot help ourselves.",a:"Sir Roger Bannister"},
  {t:"The will to win means nothing without the will to prepare.",a:"Juma Ikangaa"},
  {t:"You have to wonder at times what you're doing out there. Over the years, I've given myself a thousand reasons to keep running, but it always comes back to where it started. It comes down to self-satisfaction and a sense of achievement.",a:"Steve Prefontaine"},
  {t:"To give anything less than your best is to sacrifice the gift.",a:"Steve Prefontaine"},
  {t:"Some seek the comfort of their therapist's office, others head to the corner pub and I, for one, head to the gym.",a:"Unknown"},
  {t:"Somebody may beat me, but they are going to have to bleed to do it.",a:"Steve Prefontaine"},
];
const FACTS = [
  // Mind & Brain
  "The average person makes about 35,000 decisions per day — most of them unconscious.",
  "By one popular estimate, the human brain can store about 2.5 petabytes of information, equivalent to 3 million hours of TV.",
  "Reading for just 6 minutes a day can reduce stress levels by up to 68%.",
  "Your brain uses about 20% of your body's total energy despite being only 2% of your body weight.",
  "Sleeping less than 6 hours per night for two weeks impairs performance as much as going 48 hours without sleep.",
  "Learning a new skill physically changes the structure of your brain through neuroplasticity.",
  "The brain's prefrontal cortex — responsible for decision-making — isn't fully developed until age 25.",
  "Multitasking reduces productivity by up to 40% and lowers IQ by 10 points temporarily.",
  // Cybersecurity & Technology
  "Zero trust security was first coined by John Kindervag at Forrester Research in 2010.",
  "The first computer virus, Creeper, was created in 1971 and displayed 'I'm the creeper, catch me if you can!'",
  "The global cybersecurity market is projected to exceed $500 billion by 2030.",
  "Microsegmentation can reduce the blast radius of a breach by up to 90%.",
  "IBM's breach studies put the average time to identify and contain a data breach at well over 200 days.",
  "The CISSP exam has a minimum of 100 questions and a maximum of 150, with a 3-hour time limit.",
  "BGP, the protocol that routes the entire internet, was designed on two cocktail napkins in 1989.",
  "The first email was sent by Ray Tomlinson in 1971 — he also chose the @ symbol for email addresses.",
  "About 6 billion people — roughly three-quarters of the world — now use the internet.",
  "The average hospital has over 10 connected medical devices per patient bed.",
  "The NIST Cybersecurity Framework is used by over 30% of US organizations.",
  "The dark web is estimated to be 400-500 times larger than the surface web.",
  "A SQL injection attack takes less than 30 seconds to execute but can take months to detect.",
  "Over 300,000 new malware samples are created every single day.",
  "The first smartphone with internet access was the Nokia 9000 Communicator, released in 1996.",
  "Python overtook JavaScript as the most-used language on GitHub in 2024.",
  // Athletics & Wrestling
  "Wrestlers have one of the highest strength-to-weight ratios of any athlete.",
  "The first Olympic wrestling competition was held in 708 BC in ancient Greece.",
  "Dan Gable went 181–1 in high school and college, then won 1972 Olympic gold without giving up a single point.",
  "Progressive overload — adding weight or reps over time — is the single most important principle in strength training.",
  "Protein synthesis after resistance training peaks within 24–48 hours — rest days are growth days.",
  "Sleep deprivation reduces athletic performance by up to 30% — recovery is training.",
  "The average wrestling match burns approximately 400–700 calories depending on intensity.",
  "VO2 max — maximum oxygen uptake — is the single best predictor of aerobic fitness and endurance performance.",
  "Running for just 5–10 minutes per day at slow speeds reduces the risk of cardiovascular disease by 45%.",
  "Creatine is one of the most studied supplements in sports science with over 500 peer-reviewed studies.",
  "Elite wrestlers typically have body fat percentages between 4–8% during competition.",
  "The fastest recorded mile run is 3:43.13, set by Hicham El Guerrouj of Morocco in 1999.",
  "Lifting weights 3 times per week for 6 months increases muscle mass by an average of 2–4 lbs.",
  "Cold water immersion after intense exercise reduces muscle soreness by up to 20%.",
  "Foam rolling before a workout can increase range of motion by up to 10%.",
  "NCAA Division I wrestling has 76 member programs competing across 10 weight classes.",
  "The Greco-Roman style of wrestling prohibits holds below the waist, focusing entirely on upper body.",
  "A wrestler's grip strength is one of the strongest predictors of overall athletic performance.",
  "Periodization — cycling training intensity — was pioneered by Soviet sports scientists in the 1950s.",
  // Nutrition & Health
  "Creatine is one of the safest and most effective supplements for increasing strength and muscle mass.",
  "Protein synthesis requires adequate leucine — found in meat, eggs, and dairy — to initiate muscle building.",
  "Dehydration of just 2% body weight impairs both physical and cognitive performance significantly.",
  "Omega-3 fatty acids reduce inflammation, improve brain function, and lower cardiovascular risk.",
  "The gut microbiome contains over 38 trillion bacteria — more than the total number of human cells.",
  "Eating protein within 30 minutes after a workout maximizes muscle protein synthesis.",
  "Intermittent fasting can improve insulin sensitivity, promote fat loss, and extend cellular lifespan.",
  "Magnesium deficiency affects over 50% of Americans and is linked to poor sleep, muscle cramps, and anxiety.",
  "Vitamin D deficiency affects over 1 billion people worldwide and is linked to depression and immune dysfunction.",
  "Eggs contain all 9 essential amino acids, making them one of the most complete protein sources available.",
  "The brain is about 60% fat — dietary fats are essential for cognitive function and mental health.",
  "Fiber intake reduces the risk of colorectal cancer by 10% for every 10g of fiber consumed daily.",
  "Red meat contains creatine, iron, zinc, and B12 — all critical for athletic performance and recovery.",
  "Caffeine improves endurance performance by 2–4% and reduces perceived effort by blocking adenosine receptors.",
  // Finance & Money
  "Compound interest is the eighth wonder of the world — money invested at 7% doubles every 10 years.",
  "The S&P 500 has returned an average of approximately 10% annually since its inception in 1957.",
  "Index funds outperform actively managed funds roughly 90% of the time over a 15-year period.",
  "The average American millionaire has 7 income streams.",
  "A 1% improvement in savings rate compounded over 30 years can mean hundreds of thousands of dollars.",
  "The 4% rule suggests retirees can withdraw 4% of their portfolio annually without running out of money.",
  "Starting to invest $200/month at age 25 vs age 35 results in nearly double the retirement balance.",
  "The average American spends $1,497 per month on non-essential purchases.",
  "Warren Buffett made 99% of his net worth after his 50th birthday — compounding takes time.",
  "Financial literacy is not taught in 80% of US high schools, yet affects every adult decision.",
  "The average 401(k) balance for Americans over 60 is approximately $228,000 — far below what's needed.",
  "Max out your Roth IRA every year (the limit is $7,000+) and it can grow to over $1 million by retirement, tax-free.",
  "Medical expenses are the #1 cause of personal bankruptcy in the United States.",
  "The average car loses 20% of its value the moment you drive it off the lot.",
  "Living below your means — not income — is the most common trait of millionaires.",
  // History & World
  "The shortest war in history lasted 38–45 minutes: the Anglo-Zanzibar War in 1896.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
  "Oxford University is older than the Aztec Empire — Oxford was founded in 1096, the Aztecs in 1428.",
  "The Great Wall of China is not visible from space with the naked eye — it's a common myth.",
  "Nintendo was founded in 1889 as a playing card company — 94 years before the NES.",
  "The Library of Alexandria contained an estimated 700,000 scrolls — the largest collection of knowledge in the ancient world.",
  "Stamps were invented before envelopes — people folded their letters and sealed them with wax.",
  "Alaska is both the westernmost and easternmost state in the United States.",
  "There are more possible chess games than atoms in the observable universe.",
  "The Eiffel Tower grows about 6 inches taller in summer due to thermal expansion of the iron.",
  "Honey never spoils — archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "The fingerprints of a koala are so similar to human fingerprints they can contaminate crime scenes.",
  "Sharks are older than trees — sharks have existed for 450 million years; trees for about 350 million.",
  "There are more trees on Earth than stars in the Milky Way galaxy.",
  "The human eye can detect a single photon of light in complete darkness.",
  // Science & Nature
  "A teaspoon of neutron star material weighs a few billion tons.",
  "Water is the only natural substance found in all three states — solid, liquid, and gas — on Earth's surface.",
  "The speed of light is 186,000 miles per second — it takes 8 minutes for light from the Sun to reach Earth.",
  "Your body replaces most of its cells every 7–10 years — you are literally a different person.",
  "DNA is so tightly coiled that if unraveled from a single human cell, it would stretch 6 feet.",
  "Lightning strikes Earth approximately 100 times per second.",
  "A day on Venus is longer than a year on Venus — it rotates so slowly.",
  "Octopuses have three hearts, blue blood, and nine brains — one central and one in each arm.",
  "The human body contains about 37 trillion cells, each performing thousands of chemical reactions per second.",
  "Butterflies taste with their feet — they have taste sensors on their legs.",
  // Personal Growth & Philosophy
  "Discipline is choosing between what you want now and what you want most.",
  "The most dangerous risk of all is the risk of spending your life not doing what you want.",
  "You can't connect the dots looking forward — only looking backward. So trust that the dots will connect.",
  "Most people overestimate what they can do in a year and underestimate what they can do in a decade.",
  "Success is not owned. It's rented — and rent is due every day.",
  "Comfort zones are where dreams go to die — and where mediocrity lives rent-free.",
  "The obstacle is not in the way. The obstacle IS the way.",
  "You are the average of the five people you spend the most time with.",
  "Hard choices, easy life. Easy choices, hard life.",
  // Home & DIY
  "Replacing your furnace filter monthly can improve HVAC efficiency by up to 15%.",
  "A leaky faucet dripping once per second wastes over 3,000 gallons of water per year.",
  "Caulking gaps around windows and doors can reduce heating and cooling bills by up to 20%.",
  "The average American home has 9 outlets per room — most were designed before smartphones existed.",
  "Water heaters account for approximately 18% of a home's energy use — the second largest consumer.",
  "A toilet that runs continuously can waste up to 200 gallons of water per day.",
  "The recommended attic insulation level for most US climates is R-38 to R-60.",
  "Cleaning refrigerator coils twice a year can extend its life by 5–10 years and improve efficiency.",
  "The average roof lasts 20–30 years depending on material — asphalt shingles, tile, or metal.",
  "A smoke detector should be tested monthly and replaced every 10 years regardless of battery status.",
  // Travel & Adventure
  "The United States has 63 designated national parks covering over 52 million acres.",
  "Yellowstone National Park sits atop one of the world's largest active supervolcanoes.",
  "The Appalachian Trail stretches 2,190 miles from Georgia to Maine — it takes 5–7 months to thru-hike.",
  "Route 66, nicknamed 'The Mother Road,' stretched 2,448 miles from Chicago to Santa Monica.",
  "The Grand Canyon is 277 miles long, up to 18 miles wide, and over a mile deep.",
  "Alaska is the largest US state by area and contains 17 of the 20 highest peaks in the United States.",
  "The Florida Keys are the only place in the continental US where you can see a coral reef.",
  "Great Smoky Mountains is the most visited US national park — receiving over 12 million visitors per year.",
  "Texas is larger than France — it covers 268,596 square miles.",
  "The Pacific Northwest's Olympic Peninsula contains the only rainforest in the continental United States.",
  "The average golfer hits their driver about 217 yards — PGA Tour pros average 295 yards.",
  "Golf was banned in Scotland in 1457 because King James II felt it distracted men from archery practice.",
  "There are over 15,000 golf courses in the United States — more than any other country.",
  "The human heart beats about 100,000 times per day and over 2.5 billion times in a lifetime.",
  "Sitting for more than 8 hours per day is linked to increased risk of heart disease, diabetes, and early death.",
  "The average American spends 93% of their life indoors.",
  "Laughter reduces cortisol and adrenaline levels and boosts immune function — it's literally medicine.",
  "The word 'salary' comes from the Latin 'salarium' — Roman soldiers were partially paid in salt.",
];

function pickPeriod4(arr, offset=0) {
  const period = Math.floor(Date.now() / (4 * 60 * 60 * 1000)) + offset;
  return arr[period % arr.length];
}
function pickPeriod8(arr, offset=0) {
  const period = Math.floor(Date.now() / (8 * 60 * 60 * 1000)) + offset;
  return arr[period % arr.length];
}

// ON THIS DAY data — keyed by MM-DD
const ON_THIS_DAY = {
  "01-01":{y:1863,e:"The Emancipation Proclamation takes effect, declaring enslaved people in Confederate states to be free."},
  "01-02":{y:1492,e:"The Reconquista ends as the last Moorish ruler surrenders Granada to Spain after 700 years."},
  "01-03":{y:1777,e:"General George Washington defeats British forces at the Battle of Princeton during the American Revolution."},
  "01-04":{y:1903,e:"Topsy the elephant is electrocuted with alternating current (AC) at Coney Island; Edison's film company records it."},
  "01-05":{y:1933,e:"Construction begins on the Golden Gate Bridge in San Francisco Bay."},
  "01-06":{y:1941,e:"Franklin D. Roosevelt delivers his famous Four Freedoms speech to Congress."},
  "01-07":{y:1979,e:"Vietnamese forces capture Phnom Penh, ending the brutal Khmer Rouge regime in Cambodia."},
  "01-08":{y:1815,e:"Andrew Jackson leads American forces to victory at the Battle of New Orleans, the final major battle of the War of 1812."},
  "01-09":{y:2007,e:"Steve Jobs introduces the original iPhone, calling it a revolutionary product that changes everything."},
  "01-10":{y:1776,e:"Thomas Paine publishes Common Sense, galvanizing American colonists toward independence."},
  "01-11":{y:1964,e:"The US Surgeon General releases the first report linking cigarette smoking to lung cancer and heart disease."},
  "01-12":{y:1966,e:"Batman premieres on ABC television, becoming an immediate pop culture sensation."},
  "01-13":{y:1888,e:"The National Geographic Society is founded in Washington, D.C."},
  "01-14":{y:1784,e:"The United States ratifies the Treaty of Paris, officially ending the American Revolutionary War."},
  "01-15":{y:1929,e:"Martin Luther King Jr. is born in Atlanta, Georgia. His birthday is now a federal holiday."},
  "01-16":{y:1919,e:"The 18th Amendment is ratified, bringing Prohibition to the United States a year later — it lasts nearly 14 years."},
  "01-17":{y:1991,e:"Operation Desert Storm begins as coalition forces launch massive air strikes against Iraq."},
  "01-18":{y:1778,e:"Captain James Cook becomes the first European to discover the Hawaiian Islands."},
  "01-19":{y:1807,e:"Robert E. Lee is born in Virginia, later to command the Confederate Army of Northern Virginia."},
  "01-20":{y:1961,e:"John F. Kennedy is inaugurated as the 35th President of the United States, the youngest ever elected."},
  "01-21":{y:1954,e:"The USS Nautilus, the world\'s first nuclear-powered submarine, is launched at Groton, Connecticut."},
  "01-22":{y:1984,e:"Apple\'s iconic 1984 Macintosh commercial airs during Super Bowl XVIII, revolutionizing advertising."},
  "01-23":{y:1849,e:"Elizabeth Blackwell becomes the first woman to receive a medical degree in the United States."},
  "01-24":{y:1848,e:"Gold is discovered at Sutter\'s Mill in California, triggering the Gold Rush of 1849."},
  "01-25":{y:1924,e:"The first Winter Olympics opens in Chamonix, France."},
  "01-26":{y:1788,e:"The First Fleet arrives at Sydney Cove, Australia, establishing the first permanent European settlement."},
  "01-27":{y:1967,e:"The Outer Space Treaty is signed, prohibiting weapons of mass destruction in space."},
  "01-28":{y:1986,e:"The Space Shuttle Challenger breaks apart 73 seconds after launch, killing all seven crew members."},
  "01-29":{y:1845,e:"Edgar Allan Poe\'s The Raven is published in New York, making him instantly famous."},
  "01-30":{y:1948,e:"Mahatma Gandhi is assassinated in New Delhi by a Hindu nationalist."},
  "01-31":{y:1958,e:"Explorer 1, the first successful American satellite, is launched into orbit."},
  "02-01":{y:2003,e:"The Space Shuttle Columbia disintegrates upon re-entry, killing all seven crew members."},
  "02-02":{y:1848,e:"The Treaty of Guadalupe Hidalgo is signed, ending the Mexican-American War."},
  "02-03":{y:1913,e:"The 16th Amendment is ratified, authorizing the federal income tax in the United States."},
  "02-04":{y:2004,e:"Mark Zuckerberg launches TheFacebook from his Harvard dorm room with fellow students."},
  "02-05":{y:1917,e:"The Constitution of Mexico is adopted, one of the first to guarantee social rights."},
  "02-06":{y:1952,e:"Queen Elizabeth II accedes to the throne following the death of her father, King George VI."},
  "02-07":{y:1812,e:"Charles Dickens is born in Portsmouth, England. He would go on to write Oliver Twist and A Tale of Two Cities."},
  "02-08":{y:1910,e:"The Boy Scouts of America is incorporated by William D. Boyce."},
  "02-09":{y:1964,e:"The Beatles make their historic debut on The Ed Sullivan Show, watched by 73 million Americans."},
  "02-10":{y:1996,e:"IBM\'s Deep Blue becomes the first computer to beat a reigning world chess champion in a game, winning game one against Garry Kasparov (he took the match)."},
  "02-11":{y:1990,e:"Nelson Mandela is released from Victor Verster Prison after 27 years of imprisonment."},
  "02-12":{y:1809,e:"Abraham Lincoln is born in a log cabin in Kentucky. He would become America\'s 16th president."},
  "02-13":{y:1633,e:"Galileo arrives in Rome to face the Inquisition for his support of heliocentrism."},
  "02-14":{y:1876,e:"Alexander Graham Bell files a patent for the telephone just hours before Elisha Gray."},
  "02-15":{y:1965,e:"Canada officially adopts its maple leaf flag after years of national debate."},
  "02-16":{y:1923,e:"Howard Carter opens the inner burial chamber of Tutankhamun\'s tomb in Egypt\'s Valley of the Kings."},
  "02-17":{y:1600,e:"Philosopher Giordano Bruno is burned at the stake for heresy, including his belief in an infinite universe."},
  "02-18":{y:1930,e:"Clyde Tombaugh discovers Pluto at the Lowell Observatory in Arizona."},
  "02-19":{y:1945,e:"US Marines land on Iwo Jima in one of the bloodiest battles of the Pacific War."},
  "02-20":{y:1962,e:"John Glenn becomes the first American to orbit Earth, completing three orbits aboard Friendship 7."},
  "02-21":{y:1965,e:"Malcolm X is assassinated at the Audubon Ballroom in New York City."},
  "02-22":{y:1980,e:"The US Olympic hockey team defeats the heavily favored Soviet Union 4-3 in the Miracle on Ice at Lake Placid."},
  "02-23":{y:1836,e:"The Battle of the Alamo begins as Mexican forces lay siege to the Texas mission."},
  "02-24":{y:1582,e:"Pope Gregory XIII issues the Gregorian calendar, the basis for the modern calendar we use today."},
  "02-25":{y:1870,e:"Hiram Revels of Mississippi becomes the first African American to serve in the US Senate."},
  "02-26":{y:1993,e:"A truck bomb explodes in the parking garage of the World Trade Center, killing six people."},
  "02-27":{y:1933,e:"The Reichstag building in Berlin is set on fire; the Nazis use it as a pretext to seize emergency powers."},
  "02-28":{y:1953,e:"James Watson and Francis Crick announce they have discovered the double helix structure of DNA."},
  "02-29":{y:1960,e:"The deadliest earthquake in Africa\'s recorded history strikes Agadir, Morocco, killing over 12,000."},
  "03-01":{y:1872,e:"President Ulysses S. Grant signs legislation creating Yellowstone as the world\'s first national park."},
  "03-02":{y:1877,e:"Rutherford B. Hayes is declared the winner of the disputed 1876 presidential election by Congress."},
  "03-03":{y:1931,e:"The Star-Spangled Banner officially becomes the national anthem of the United States."},
  "03-04":{y:1789,e:"The US Constitution goes into effect as the first Congress of the United States meets in New York."},
  "03-05":{y:1770,e:"British soldiers kill five colonists in the Boston Massacre, inflaming revolutionary sentiment."},
  "03-06":{y:1857,e:"The Supreme Court issues the Dred Scott decision, ruling that Black people are not citizens."},
  "03-07":{y:1965,e:"Civil rights marchers are beaten by police on Bloody Sunday on the Edmund Pettus Bridge in Selma."},
  "03-08":{y:1917,e:"The February Revolution begins in Russia as workers and soldiers rise up against the czar."},
  "03-09":{y:1862,e:"The ironclad warships USS Monitor and CSS Virginia clash in the first battle between iron ships."},
  "03-10":{y:1876,e:"Alexander Graham Bell makes the first successful telephone call, saying Mr. Watson, come here."},
  "03-11":{y:2011,e:"A massive earthquake and tsunami strike Japan, triggering the Fukushima nuclear disaster."},
  "03-12":{y:1989,e:"Tim Berners-Lee submits his proposal for the World Wide Web to CERN, changing civilization forever."},
  "03-13":{y:1781,e:"William Herschel discovers Uranus, the first planet found with a telescope."},
  "03-14":{y:1879,e:"Albert Einstein is born in Ulm, Germany. His theories of relativity would reshape physics."},
  "03-15":{y:-44,e:"Julius Caesar is stabbed to death on the Ides of March by a group of Roman senators."},
  "03-16":{y:1968,e:"US soldiers massacre hundreds of unarmed civilians at My Lai, Vietnam, one of the war\'s worst atrocities."},
  "03-17":{y:461,e:"Saint Patrick, the patron saint of Ireland, dies. His feast day is now celebrated worldwide."},
  "03-18":{y:1965,e:"Soviet cosmonaut Alexei Leonov performs the first spacewalk, floating outside Voskhod 2 for 12 minutes."},
  "03-19":{y:1918,e:"Congress authorizes Daylight Saving Time in the US for the first time to conserve wartime energy."},
  "03-20":{y:2003,e:"The US-led coalition invades Iraq, beginning Operation Iraqi Freedom."},
  "03-21":{y:1685,e:"Johann Sebastian Bach is born in Eisenach, Germany. He would compose over 1,000 musical works."},
  "03-22":{y:1972,e:"The Equal Rights Amendment passes Congress and is sent to the states for ratification."},
  "03-23":{y:1775,e:"Patrick Henry delivers his famous Give me liberty, or give me death speech in Virginia."},
  "03-24":{y:1989,e:"The Exxon Valdez runs aground in Alaska, spilling 11 million gallons of oil."},
  "03-25":{y:1807,e:"Britain\'s Slave Trade Act receives royal assent, abolishing the slave trade throughout the Empire."},
  "03-26":{y:1979,e:"Egypt and Israel sign a historic peace treaty at the White House, the first between Israel and an Arab state."},
  "03-27":{y:1977,e:"The deadliest aviation disaster in history occurs when two Boeing 747s collide at Tenerife, killing 583."},
  "03-28":{y:1979,e:"A partial nuclear meltdown occurs at Three Mile Island in Pennsylvania, the worst US nuclear accident."},
  "03-29":{y:1973,e:"The last US combat troops leave Vietnam, ending direct American military involvement in the war."},
  "03-30":{y:1867,e:"The United States purchases Alaska from Russia for $7.2 million, about 2 cents per acre."},
  "03-31":{y:1889,e:"The Eiffel Tower officially opens in Paris, at the time the tallest man-made structure in the world."},
  "04-01":{y:1976,e:"Apple Computer Company is founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in a garage."},
  "04-02":{y:1917,e:"President Woodrow Wilson asks Congress to declare war on Germany, bringing the US into WWI."},
  "04-03":{y:1860,e:"The Pony Express begins its first mail run, delivering letters from Missouri to California in 10 days."},
  "04-04":{y:1968,e:"Martin Luther King Jr. is assassinated at the Lorraine Motel in Memphis, Tennessee."},
  "04-05":{y:1614,e:"Native American princess Pocahontas marries English colonist John Rolfe in Virginia."},
  "04-06":{y:1896,e:"The first modern Olympic Games open in Athens, Greece, featuring 241 athletes from 14 nations."},
  "04-07":{y:1948,e:"The World Health Organization is established by the United Nations."},
  "04-08":{y:1974,e:"Hank Aaron breaks Babe Ruth\'s all-time home run record, hitting his 715th career home run."},
  "04-09":{y:1865,e:"Confederate General Robert E. Lee surrenders to Ulysses S. Grant at Appomattox, ending the Civil War."},
  "04-10":{y:1912,e:"The RMS Titanic departs Southampton on her ill-fated maiden voyage to New York."},
  "04-11":{y:1970,e:"Apollo 13 launches. Two days later, an oxygen tank explodes, beginning a dramatic rescue mission."},
  "04-12":{y:1961,e:"Yuri Gagarin becomes the first human to travel to space, orbiting Earth aboard Vostok 1."},
  "04-13":{y:1743,e:"Thomas Jefferson is born in Virginia. He would draft the Declaration of Independence."},
  "04-14":{y:1865,e:"President Abraham Lincoln is shot by John Wilkes Booth at Ford\'s Theatre in Washington, D.C."},
  "04-15":{y:1912,e:"The RMS Titanic sinks in the North Atlantic after striking an iceberg, killing over 1,500 people."},
  "04-16":{y:1947,e:"The Texas City disaster: a ship loaded with ammonium nitrate explodes in the deadliest US industrial accident."},
  "04-17":{y:1961,e:"The CIA-sponsored Bay of Pigs invasion of Cuba fails disastrously, embarrassing the Kennedy administration."},
  "04-18":{y:1906,e:"A massive earthquake devastates San Francisco, with the resulting fires killing over 3,000 people."},
  "04-19":{y:1995,e:"A truck bomb destroys the Alfred P. Murrah Federal Building in Oklahoma City, killing 168 people."},
  "04-20":{y:1999,e:"Two students open fire at Columbine High School in Colorado, killing 13 people."},
  "04-21":{y:-753,e:"According to Roman tradition, Romulus founds the city of Rome on Palatine Hill."},
  "04-22":{y:1970,e:"The first Earth Day is celebrated, launching the modern environmental movement."},
  "04-23":{y:1564,e:"William Shakespeare is born in Stratford-upon-Avon, England. He would write 37 plays and 154 sonnets."},
  "04-24":{y:1990,e:"The Hubble Space Telescope is launched into orbit, eventually revolutionizing our view of the universe."},
  "04-25":{y:1953,e:"James Watson and Francis Crick publish their landmark paper on the double helix structure of DNA."},
  "04-26":{y:1986,e:"The Chernobyl nuclear power plant explodes in Soviet Ukraine, causing the worst nuclear disaster in history."},
  "04-27":{y:1981,e:"Xerox introduces the Star workstation, the first commercial computer to ship with a mouse and a graphical interface."},
  "04-28":{y:1945,e:"Italian dictator Benito Mussolini is captured and executed by Italian partisans."},
  "04-29":{y:1945,e:"US forces liberate Dachau concentration camp in Germany, one of the first to be freed."},
  "04-30":{y:1975,e:"Saigon falls to North Vietnamese forces, ending the Vietnam War."},
  "05-01":{y:1931,e:"The Empire State Building officially opens in New York City, becoming the world\'s tallest building."},
  "05-02":{y:1945,e:"Soviet forces capture Berlin, effectively ending World War II in Europe."},
  "05-03":{y:1469,e:"Niccolò Machiavelli, author of The Prince, is born in Florence."},
  "05-04":{y:1970,e:"National Guard troops open fire on student protesters at Kent State University, killing four students."},
  "05-05":{y:1961,e:"Alan Shepard becomes the first American in space aboard Freedom 7."},
  "05-06":{y:1954,e:"Roger Bannister becomes the first person to run a mile in under four minutes, finishing in 3:59.4."},
  "05-07":{y:1945,e:"Nazi Germany signs an unconditional surrender, ending World War II in Europe."},
  "05-08":{y:1945,e:"V-E Day: Victory in Europe is celebrated worldwide as Germany\'s surrender takes effect."},
  "05-09":{y:1926,e:"Richard Byrd claims to be the first person to fly over the North Pole."},
  "05-10":{y:1869,e:"The First Transcontinental Railroad is completed as the golden spike is driven at Promontory Summit, Utah."},
  "05-11":{y:1997,e:"IBM\'s Deep Blue defeats world chess champion Garry Kasparov, marking a milestone for artificial intelligence."},
  "05-12":{y:1820,e:"Florence Nightingale is born in Florence, Italy. She would revolutionize nursing and modern healthcare."},
  "05-13":{y:1981,e:"Pope John Paul II is shot and critically wounded in Saint Peter\'s Square by a Turkish gunman."},
  "05-14":{y:1948,e:"The State of Israel declares independence, hours before the British Mandate expires."},
  "05-15":{y:1940,e:"McDonald\'s opens its first restaurant in San Bernardino, California, beginning a fast food revolution."},
  "05-16":{y:1929,e:"The first Academy Awards ceremony is held at the Hollywood Roosevelt Hotel in just 15 minutes."},
  "05-17":{y:1954,e:"The Supreme Court unanimously rules racial segregation in public schools unconstitutional in Brown v. Board of Education."},
  "05-18":{y:1980,e:"Mount St. Helens erupts in Washington State in the deadliest volcanic event in US history."},
  "05-19":{y:1536,e:"Anne Boleyn, second wife of Henry VIII, is executed at the Tower of London for treason."},
  "05-20":{y:1927,e:"Charles Lindbergh takes off from New York on the first solo nonstop transatlantic flight to Paris."},
  "05-21":{y:1932,e:"Amelia Earhart becomes the first woman to fly solo across the Atlantic Ocean."},
  "05-22":{y:1990,e:"Microsoft releases Windows 3.0, the first commercially successful version of Windows."},
  "05-23":{y:1934,e:"Outlaws Bonnie Parker and Clyde Barrow are ambushed and killed by law enforcement in Louisiana."},
  "05-24":{y:1844,e:"Samuel Morse sends the first telegraph message: What hath God wrought!"},
  "05-25":{y:1977,e:"Star Wars opens in theaters, transforming Hollywood and creating the modern blockbuster era."},
  "05-26":{y:1940,e:"The Dunkirk evacuation begins, rescuing over 330,000 Allied troops from German-occupied France."},
  "05-27":{y:1937,e:"The Golden Gate Bridge opens to pedestrians in San Francisco after four years of construction."},
  "05-28":{y:-585,e:"By tradition, a solar eclipse halts the Battle of Halys, ending a war between Lydia and Media."},
  "05-29":{y:1953,e:"Edmund Hillary and Tenzing Norgay become the first people confirmed to have summited Mount Everest."},
  "05-30":{y:1431,e:"Joan of Arc is burned at the stake for heresy in Rouen, France. She was 19 years old."},
  "05-31":{y:1889,e:"The Johnstown Flood kills over 2,200 people in Pennsylvania after a dam failure."},
  "06-01":{y:1980,e:"CNN launches as the world\'s first 24-hour all-news television channel."},
  "06-02":{y:1953,e:"Queen Elizabeth II is crowned at Westminster Abbey in a ceremony watched by millions on television."},
  "06-03":{y:1965,e:"Ed White becomes the first American to walk in space during the Gemini 4 mission."},
  "06-04":{y:1940,e:"Winston Churchill delivers his famous We shall fight on the beaches speech to the House of Commons."},
  "06-05":{y:1967,e:"Israel launches preemptive strikes against Egypt, beginning the Six-Day War."},
  "06-06":{y:1944,e:"D-Day: Allied forces land on the beaches of Normandy in the largest seaborne invasion in history."},
  "06-07":{y:1099,e:"Crusaders begin their siege of Jerusalem during the First Crusade."},
  "06-08":{y:1949,e:"George Orwell\'s Nineteen Eighty-Four is published, introducing the concept of Big Brother."},
  "06-09":{y:1973,e:"Secretariat wins the Belmont Stakes in record time to complete horse racing\'s Triple Crown."},
  "06-10":{y:1935,e:"Alcoholics Anonymous is founded by Bill Wilson and Dr. Bob Smith in Akron, Ohio."},
  "06-11":{y:1955,e:"The deadliest crash in motorsport history occurs at the Le Mans 24-hour race, killing over 80 people."},
  "06-12":{y:1987,e:"President Reagan delivers his famous Tear down this wall speech at the Brandenburg Gate in Berlin."},
  "06-13":{y:1966,e:"The Supreme Court rules in Miranda v. Arizona that suspects must be informed of their rights."},
  "06-14":{y:1775,e:"The Continental Army is established by the Second Continental Congress, with George Washington as commander."},
  "06-15":{y:1215,e:"King John of England signs the Magna Carta at Runnymede, limiting royal power and establishing rule of law."},
  "06-16":{y:1884,e:"The first purpose-built roller coaster in America opens at Coney Island, New York."},
  "06-17":{y:1972,e:"Five men are arrested for breaking into Democratic National Committee headquarters at the Watergate complex."},
  "06-18":{y:1815,e:"Napoleon Bonaparte is defeated at the Battle of Waterloo, ending his rule over France."},
  "06-19":{y:1865,e:"Enslaved people in Texas learn of their freedom, two months after the Civil War ended, now celebrated as Juneteenth."},
  "06-20":{y:1782,e:"The Great Seal of the United States is adopted, featuring the bald eagle and E Pluribus Unum."},
  "06-21":{y:1948,e:"Columbia Records introduces the 33 RPM vinyl LP record, revolutionizing the music industry."},
  "06-22":{y:1941,e:"Nazi Germany launches Operation Barbarossa, invading the Soviet Union with 3.8 million troops."},
  "06-23":{y:1868,e:"Christopher Sholes patents the first practical typewriter, transforming office work forever."},
  "06-24":{y:1948,e:"The Soviet Union begins the Berlin Blockade, prompting the Western Allies to airlift supplies."},
  "06-25":{y:1950,e:"North Korea invades South Korea, beginning the Korean War and testing the new United Nations."},
  "06-26":{y:1945,e:"The United Nations Charter is signed by 50 nations in San Francisco."},
  "06-27":{y:1950,e:"President Truman orders US forces to South Korea after the UN Security Council calls for military action."},
  "06-28":{y:1914,e:"Archduke Franz Ferdinand of Austria is assassinated in Sarajevo, triggering World War I."},
  "06-29":{y:1995,e:"The US Space Shuttle Atlantis docks with the Russian Mir space station for the first time."},
  "06-30":{y:1908,e:"A massive explosion near the Tunguska River in Siberia flattens 800 square miles of forest."},
  "07-01":{y:1867,e:"Canada becomes a self-governing dominion within the British Empire, celebrated as Canada Day."},
  "07-02":{y:1776,e:"The Continental Congress votes in favor of American independence from Britain, two days before July 4th."},
  "07-03":{y:1863,e:"The Battle of Gettysburg ends after three bloody days, marking a turning point in the Civil War."},
  "07-04":{y:1776,e:"The United States Declaration of Independence is formally adopted by the Continental Congress."},
  "07-05":{y:1996,e:"Dolly the sheep is born, the first mammal successfully cloned from an adult somatic cell."},
  "07-06":{y:1928,e:"Lights of New York, the first all-talking feature film, premieres in New York."},
  "07-07":{y:1981,e:"Sandra Day O\'Connor is nominated by President Reagan as the first female Supreme Court justice."},
  "07-08":{y:1947,e:"An unidentified object crashes near Roswell, New Mexico, sparking decades of UFO conspiracy theories."},
  "07-09":{y:1850,e:"President Zachary Taylor dies in office from gastroenteritis, just 16 months into his term."},
  "07-10":{y:1925,e:"The Scopes Monkey Trial begins in Tennessee, pitting evolution against creationism in a national debate."},
  "07-11":{y:1979,e:"Skylab, America\'s first space station, falls from orbit and crashes into the Australian Outback."},
  "07-12":{y:-100,e:"Julius Caesar is traditionally said to be born. He would become Rome\'s most famous general and dictator."},
  "07-13":{y:1985,e:"Live Aid concerts in London and Philadelphia raise over $125 million for African famine relief."},
  "07-14":{y:1789,e:"French revolutionaries storm the Bastille fortress in Paris, igniting the French Revolution."},
  "07-15":{y:1799,e:"The Rosetta Stone is discovered by French soldiers near the Egyptian town of Rosetta."},
  "07-16":{y:1969,e:"Apollo 11 launches from Kennedy Space Center, beginning humanity\'s first voyage to the Moon."},
  "07-17":{y:1955,e:"Disneyland opens in Anaheim, California, with Walt Disney hosting the televised grand opening."},
  "07-18":{y:1969,e:"Edward Kennedy drives off a bridge on Chappaquiddick Island, killing passenger Mary Jo Kopechne."},
  "07-19":{y:1848,e:"The Seneca Falls Convention begins in New York, the first women\'s rights convention in US history."},
  "07-20":{y:1969,e:"Neil Armstrong and Buzz Aldrin become the first humans to walk on the Moon during Apollo 11."},
  "07-21":{y:1861,e:"The first Battle of Bull Run results in a Confederate victory, shocking the North with the war\'s reality."},
  "07-22":{y:1937,e:"The US Senate rejects FDR\'s plan to pack the Supreme Court with additional justices."},
  "07-23":{y:1904,e:"The ice cream cone is invented at the St. Louis World\'s Fair when a waffle vendor helps an ice cream seller."},
  "07-24":{y:1847,e:"Brigham Young and Mormon pioneers arrive in the Salt Lake Valley, declaring This is the right place."},
  "07-25":{y:1978,e:"Louise Brown, the world\'s first test-tube baby, is born in England following in vitro fertilization."},
  "07-26":{y:1948,e:"President Truman signs Executive Order 9981, desegregating the United States Armed Forces."},
  "07-27":{y:1953,e:"The Korean War armistice is signed, ending three years of fighting with a ceasefire along the 38th parallel."},
  "07-28":{y:1914,e:"Austria-Hungary declares war on Serbia, officially beginning World War I."},
  "07-29":{y:1981,e:"Prince Charles and Lady Diana Spencer marry at St. Paul\'s Cathedral, watched by 750 million worldwide."},
  "07-30":{y:1619,e:"The first representative assembly in the Americas convenes at Jamestown, Virginia."},
  "07-31":{y:1991,e:"Presidents Bush and Gorbachev sign the START I treaty, the first agreement to reduce nuclear weapons."},
  "08-01":{y:1981,e:"MTV launches with the Buggles\' Video Killed the Radio Star, beginning the music video era."},
  "08-02":{y:1990,e:"Iraq invades Kuwait, triggering international condemnation and eventually Operation Desert Storm."},
  "08-03":{y:1492,e:"Christopher Columbus departs from Spain, beginning his voyage to the Americas."},
  "08-04":{y:1944,e:"Anne Frank and her family are discovered by the Nazis in their Amsterdam hiding place."},
  "08-05":{y:1962,e:"Marilyn Monroe is found dead of a barbiturate overdose in her Los Angeles home. She was 36."},
  "08-06":{y:1945,e:"The United States drops an atomic bomb on Hiroshima, Japan, killing an estimated 80,000 instantly."},
  "08-07":{y:1782,e:"George Washington creates the Badge of Military Merit, which would later become the Purple Heart."},
  "08-08":{y:1974,e:"Richard Nixon announces he will resign as President of the United States."},
  "08-09":{y:1974,e:"Richard Nixon becomes the only US president to resign, handing power to Gerald Ford."},
  "08-10":{y:1793,e:"The Louvre Museum opens to the public in Paris, initially displaying 537 paintings."},
  "08-11":{y:1999,e:"The last total solar eclipse of the 20th century is visible across Europe and the Middle East."},
  "08-12":{y:1981,e:"IBM introduces its first personal computer, the IBM PC, launching the personal computing revolution."},
  "08-13":{y:1961,e:"East Germany begins erecting the Berlin Wall, dividing the city and cutting off escape to the West."},
  "08-14":{y:1945,e:"Japan announces its surrender to the Allies, ending World War II in the Pacific."},
  "08-15":{y:1945,e:"V-J Day: Emperor Hirohito announces Japan's surrender in a radio address, effectively ending World War II."},
  "08-16":{y:1977,e:"Elvis Presley dies at his Graceland estate in Memphis, Tennessee. He was 42 years old."},
  "08-17":{y:1978,e:"The Double Eagle II becomes the first balloon to cross the Atlantic Ocean successfully."},
  "08-18":{y:1920,e:"The 19th Amendment is ratified, granting American women the right to vote."},
  "08-19":{y:1919,e:"Afghanistan gains full independence from Britain following the Third Anglo-Afghan War."},
  "08-20":{y:1940,e:"Winston Churchill delivers his Never was so much owed by so many to so few speech about RAF pilots."},
  "08-21":{y:1959,e:"Hawaii becomes the 50th state admitted to the United States."},
  "08-22":{y:1864,e:"The first Geneva Convention is signed, establishing rules for the humane treatment of war wounded."},
  "08-23":{y:1939,e:"Nazi Germany and the Soviet Union sign the Molotov-Ribbentrop non-aggression pact."},
  "08-24":{y:1814,e:"British forces burn the White House and Capitol during the War of 1812."},
  "08-25":{y:1916,e:"The National Park Service is established by President Woodrow Wilson."},
  "08-26":{y:1920,e:"The 19th Amendment officially takes effect, guaranteeing women\'s right to vote throughout the United States."},
  "08-27":{y:1928,e:"The Kellogg-Briand Pact is signed by 15 nations, renouncing war as an instrument of national policy."},
  "08-28":{y:1963,e:"Martin Luther King Jr. delivers his I Have a Dream speech during the March on Washington."},
  "08-29":{y:2005,e:"Hurricane Katrina makes landfall near New Orleans, causing catastrophic flooding and over 1,800 deaths."},
  "08-30":{y:1967,e:"Thurgood Marshall is confirmed as the first African American Supreme Court justice."},
  "08-31":{y:1997,e:"Princess Diana is killed in a car crash in the Pont de l\'Alma tunnel in Paris. She was 36."},
  "09-01":{y:1939,e:"Nazi Germany invades Poland, beginning World War II in Europe."},
  "09-02":{y:1945,e:"Japan signs the instrument of surrender aboard the USS Missouri, officially ending World War II."},
  "09-03":{y:1783,e:"The Treaty of Paris is signed, officially ending the American Revolutionary War with Britain."},
  "09-04":{y:1882,e:"Thomas Edison\'s Pearl Street Station begins operation, providing the first commercial electrical service."},
  "09-05":{y:1972,e:"Palestinian terrorists kill 11 Israeli athletes at the Munich Olympics, shocking the world."},
  "09-06":{y:1522,e:"Ferdinand Magellan\'s expedition completes the first circumnavigation of the globe."},
  "09-07":{y:1822,e:"Brazil declares independence from Portugal, becoming South America\'s largest nation."},
  "09-08":{y:1974,e:"President Gerald Ford pardons Richard Nixon for all crimes he committed while president."},
  "09-09":{y:1956,e:"Elvis Presley appears on The Ed Sullivan Show for the first time, drawing a record 60 million viewers."},
  "09-10":{y:1846,e:"Elias Howe patents the sewing machine, revolutionizing the textile and fashion industries."},
  "09-11":{y:2001,e:"Coordinated terrorist attacks destroy the World Trade Center and damage the Pentagon, killing nearly 3,000."},
  "09-12":{y:1962,e:"President Kennedy delivers his We choose to go to the Moon speech at Rice University."},
  "09-13":{y:1814,e:"Francis Scott Key writes the poem that would become The Star-Spangled Banner."},
  "09-14":{y:1812,e:"Napoleon\'s forces enter Moscow to find it burning, a turning point in his catastrophic Russian campaign."},
  "09-15":{y:1935,e:"Nazi Germany passes the Nuremberg Laws, stripping Jews of citizenship and basic rights."},
  "09-16":{y:1620,e:"The Mayflower departs Plymouth, England, carrying 102 Pilgrims to the New World."},
  "09-17":{y:1787,e:"The United States Constitution is signed by 39 delegates at the Constitutional Convention in Philadelphia."},
  "09-18":{y:1947,e:"The United States Air Force is established as an independent branch of the military."},
  "09-19":{y:1955,e:"Argentine President Juan Peron is overthrown in a military coup and flees into exile."},
  "09-20":{y:1973,e:"Billie Jean King defeats Bobby Riggs in the Battle of the Sexes tennis match watched by 90 million people."},
  "09-21":{y:1937,e:"J.R.R. Tolkien publishes The Hobbit, introducing readers to Middle-earth for the first time."},
  "09-22":{y:1862,e:"President Lincoln issues the preliminary Emancipation Proclamation, to take effect January 1, 1863."},
  "09-23":{y:1806,e:"Lewis and Clark return to St. Louis after their epic 8,000-mile expedition to the Pacific and back."},
  "09-24":{y:1789,e:"The Supreme Court of the United States is established by Congress under the Judiciary Act."},
  "09-25":{y:1956,e:"The first transatlantic telephone cable begins commercial service between the US and UK."},
  "09-26":{y:1960,e:"The first televised presidential debate occurs between John F. Kennedy and Richard Nixon."},
  "09-27":{y:1825,e:"The world\'s first public steam railway, the Stockton and Darlington Railway, opens in England."},
  "09-28":{y:-551,e:"Confucius is traditionally said to be born in China. His teachings would shape East Asian philosophy for millennia."},
  "09-29":{y:1829,e:"Scotland Yard, the headquarters of London\'s Metropolitan Police, is established."},
  "09-30":{y:1935,e:"Hoover Dam, the largest dam in the Western Hemisphere at the time, is dedicated by President Roosevelt."},
  "10-01":{y:1949,e:"Mao Zedong proclaims the founding of the People\'s Republic of China from Tiananmen Square."},
  "10-02":{y:1925,e:"John Logie Baird successfully demonstrates a working television system for the first time in London."},
  "10-03":{y:1990,e:"East and West Germany reunify after 45 years of division following the fall of the Berlin Wall."},
  "10-04":{y:1957,e:"The Soviet Union launches Sputnik 1, the first artificial satellite, beginning the Space Age."},
  "10-05":{y:1962,e:"The Beatles release their first single, Love Me Do, launching Beatlemania and a musical revolution."},
  "10-06":{y:1981,e:"Egyptian President Anwar Sadat is assassinated during a military parade in Cairo."},
  "10-07":{y:1571,e:"The Battle of Lepanto halts Ottoman naval expansion into the Mediterranean."},
  "10-08":{y:1871,e:"The Great Chicago Fire begins, burning for two days and destroying much of the city."},
  "10-09":{y:1967,e:"Che Guevara is executed in Bolivia, becoming one of the most iconic revolutionary martyrs."},
  "10-10":{y:1911,e:"The Xinhai Revolution begins in China, leading to the end of imperial rule."},
  "10-11":{y:1975,e:"Saturday Night Live premieres on NBC with guest host George Carlin."},
  "10-12":{y:1492,e:"Christopher Columbus lands in the Bahamas, beginning the European colonization of the Americas."},
  "10-13":{y:1792,e:"The cornerstone of the White House is laid in Washington, D.C."},
  "10-14":{y:1947,e:"Chuck Yeager becomes the first person to break the sound barrier in the Bell X-1 aircraft."},
  "10-15":{y:1951,e:"I Love Lucy premieres on CBS, becoming the most-watched show on American television for four seasons."},
  "10-16":{y:1793,e:"Marie Antoinette is guillotined during the French Revolution\'s Reign of Terror."},
  "10-17":{y:1989,e:"A magnitude 6.9 earthquake strikes San Francisco during the World Series, killing 63 people."},
  "10-18":{y:1867,e:"The United States formally takes possession of Alaska from Russia in a transfer ceremony at Sitka."},
  "10-19":{y:1987,e:"Black Monday: the Dow Jones Industrial Average drops 22.6% in a single day, the largest one-day crash in history."},
  "10-20":{y:1973,e:"The Saturday Night Massacre: Nixon fires the special prosecutor investigating Watergate."},
  "10-21":{y:1879,e:"Thomas Edison successfully tests his first practical incandescent light bulb, burning for 13.5 hours."},
  "10-22":{y:1962,e:"President Kennedy announces a naval blockade of Cuba during the Cuban Missile Crisis."},
  "10-23":{y:1983,e:"A suicide bomber kills 241 US Marines in Beirut in the deadliest terrorist attack on Americans to that point."},
  "10-24":{y:1945,e:"The United Nations officially comes into existence after ratification of its charter."},
  "10-25":{y:1415,e:"English forces under Henry V defeat the French at Agincourt in a major upset of the Hundred Years War."},
  "10-26":{y:1881,e:"The Gunfight at the O.K. Corral occurs in Tombstone, Arizona, lasting just 30 seconds."},
  "10-27":{y:1904,e:"New York City's first subway line opens, running about 9 miles from City Hall to 145th Street."},
  "10-28":{y:1886,e:"The Statue of Liberty is dedicated in New York Harbor, a gift from France to the United States."},
  "10-29":{y:1969,e:"The first message is sent over ARPANET, the precursor to the internet, though it crashed after two letters."},
  "10-30":{y:1938,e:"Orson Welles broadcasts War of the Worlds on radio, causing widespread panic among listeners."},
  "10-31":{y:1517,e:"Martin Luther nails his 95 Theses to the church door in Wittenberg, sparking the Protestant Reformation."},
  "11-01":{y:1755,e:"The Great Lisbon Earthquake kills an estimated 40,000 people and triggers a tsunami."},
  "11-02":{y:1947,e:"Howard Hughes makes the only flight of the Spruce Goose, the largest wooden aircraft ever built."},
  "11-03":{y:1957,e:"Laika the dog is launched into orbit aboard Sputnik 2, becoming the first living creature in space."},
  "11-04":{y:1979,e:"Iranian students storm the US Embassy in Tehran, beginning the 444-day hostage crisis."},
  "11-05":{y:1605,e:"Guy Fawkes is arrested in the cellars of Parliament in London, foiling the Gunpowder Plot."},
  "11-06":{y:1860,e:"Abraham Lincoln is elected the 16th President of the United States, triggering Southern secession."},
  "11-07":{y:1944,e:"Franklin D. Roosevelt wins his fourth presidential term, the only president elected four times."},
  "11-08":{y:1895,e:"Wilhelm Rontgen discovers X-rays while experimenting with cathode ray tubes in his laboratory."},
  "11-09":{y:1989,e:"The Berlin Wall falls as East Germany opens its borders, reuniting families separated for 28 years."},
  "11-10":{y:1775,e:"The United States Marine Corps is established by the Second Continental Congress."},
  "11-11":{y:1918,e:"World War I ends as an armistice takes effect at the 11th hour of the 11th day of the 11th month."},
  "11-12":{y:1954,e:"Ellis Island closes after processing over 12 million immigrants to the United States since 1892."},
  "11-13":{y:1971,e:"NASA\'s Mariner 9 becomes the first spacecraft to orbit another planet, Mars."},
  "11-14":{y:1889,e:"Journalist Nellie Bly begins her journey to travel around the world in fewer than 80 days."},
  "11-15":{y:1777,e:"The Continental Congress adopts the Articles of Confederation, the first constitution of the United States."},
  "11-16":{y:1532,e:"Spanish conquistador Francisco Pizarro captures Inca emperor Atahualpa, beginning the fall of the Inca Empire."},
  "11-17":{y:1869,e:"The Suez Canal officially opens, linking the Mediterranean and Red Seas for the first time."},
  "11-18":{y:1978,e:"918 members of the Peoples Temple die in a mass murder-suicide in Jonestown, Guyana."},
  "11-19":{y:1863,e:"Abraham Lincoln delivers the Gettysburg Address, a 272-word speech that redefines American democracy."},
  "11-20":{y:1945,e:"The Nuremberg Trials begin, holding Nazi leaders accountable for crimes against humanity."},
  "11-21":{y:1783,e:"Jean-Francois Pilatre de Rozier makes the first manned balloon flight in Paris, rising 300 feet."},
  "11-22":{y:1963,e:"President John F. Kennedy is assassinated in Dallas, Texas, while riding in a presidential motorcade."},
  "11-23":{y:1963,e:"The first episode of Doctor Who airs on the BBC, beginning one of the longest-running sci-fi series."},
  "11-24":{y:1859,e:"Charles Darwin publishes On the Origin of Species, introducing the theory of evolution."},
  "11-25":{y:1963,e:"President Kennedy is buried at Arlington National Cemetery, with 93 world leaders attending."},
  "11-26":{y:1922,e:"Howard Carter opens the inner chamber of Tutankhamun\'s tomb, describing wonderful things within."},
  "11-27":{y:1095,e:"Pope Urban II calls for the First Crusade to recapture Jerusalem from Muslim forces."},
  "11-28":{y:1520,e:"Ferdinand Magellan and his crew become the first Europeans to navigate the treacherous Strait of Magellan."},
  "11-29":{y:1929,e:"Richard Byrd and his crew complete the first flight over the South Pole."},
  "11-30":{y:1835,e:"Mark Twain is born in Florida, Missouri. He would write The Adventures of Tom Sawyer and Huckleberry Finn."},
  "12-01":{y:1955,e:"Rosa Parks refuses to give up her bus seat in Montgomery, Alabama, sparking the civil rights movement."},
  "12-02":{y:1804,e:"Napoleon Bonaparte crowns himself Emperor of France at Notre-Dame Cathedral in Paris."},
  "12-03":{y:1967,e:"Dr. Christiaan Barnard performs the world\'s first successful human heart transplant in Cape Town."},
  "12-04":{y:1991,e:"Terry Anderson is freed after 2,455 days as a hostage in Beirut, the last and longest-held American captive."},
  "12-05":{y:1933,e:"Prohibition ends in the United States as Utah ratifies the 21st Amendment."},
  "12-06":{y:1865,e:"The 13th Amendment is ratified, officially abolishing slavery throughout the United States."},
  "12-07":{y:1941,e:"Japan attacks Pearl Harbor in a surprise aerial attack, bringing the United States into World War II."},
  "12-08":{y:1941,e:"The United States and Britain declare war on Japan, one day after the Pearl Harbor attack."},
  "12-09":{y:1992,e:"British Prime Minister John Major announces the separation of Prince Charles and Princess Diana."},
  "12-10":{y:1901,e:"The first Nobel Prizes are awarded in Stockholm, Sweden, on the fifth anniversary of Alfred Nobel\'s death."},
  "12-11":{y:1936,e:"King Edward VIII abdicates the British throne to marry American divorcee Wallis Simpson."},
  "12-12":{y:1901,e:"Guglielmo Marconi receives the first transatlantic radio signal, transmitted from England to Canada."},
  "12-13":{y:1642,e:"Dutch explorer Abel Tasman becomes the first European to discover New Zealand."},
  "12-14":{y:1911,e:"Roald Amundsen and his Norwegian team become the first explorers to reach the South Pole."},
  "12-15":{y:1791,e:"The Bill of Rights, the first ten amendments to the US Constitution, is ratified."},
  "12-16":{y:1773,e:"American colonists dump 342 chests of British tea into Boston Harbor during the Boston Tea Party."},
  "12-17":{y:1903,e:"Orville Wright makes the first successful powered airplane flight at Kitty Hawk, North Carolina."},
  "12-18":{y:1865,e:"The 13th Amendment is proclaimed adopted, formally ending slavery in the United States."},
  "12-19":{y:1998,e:"President Bill Clinton is impeached by the House of Representatives on charges of perjury and obstruction."},
  "12-20":{y:1803,e:"The United States takes possession of Louisiana from France, doubling the nation\'s size."},
  "12-21":{y:1620,e:"The Pilgrims aboard the Mayflower land at Plymouth Rock, Massachusetts."},
  "12-22":{y:1944,e:"US General Anthony McAuliffe responds to a German surrender demand with a single word: Nuts!"},
  "12-23":{y:1947,e:"Bell Labs scientists demonstrate the transistor, making modern electronics possible."},
  "12-24":{y:1968,e:"Apollo 8 astronauts broadcast a Christmas Eve message from lunar orbit, reading from Genesis."},
  "12-25":{y:1991,e:"Mikhail Gorbachev resigns as president of the USSR, formally dissolving the Soviet Union."},
  "12-26":{y:1776,e:"George Washington and his army cross the Delaware River to surprise Hessian forces at Trenton."},
  "12-27":{y:1831,e:"HMS Beagle sets sail with Charles Darwin aboard, beginning the voyage that would inspire his theory of evolution."},
  "12-28":{y:1895,e:"The Lumiere brothers hold the first paid public film screening in Paris, launching the cinema era."},
  "12-29":{y:1890,e:"US troops massacre approximately 300 Lakota Sioux at Wounded Knee, South Dakota."},
  "12-30":{y:1922,e:"The Union of Soviet Socialist Republics is officially formed, creating the world\'s first communist superstate."},
  "12-31":{y:1999,e:"The world holds its breath for Y2K as the millennium rolls over — and most computers keep running."},
};

function fmtYear(y){ return y < 0 ? (-y) + ' BC' : String(y); }

function getTodayHistory() {
  const now = new Date();
  const mm = String(now.getMonth()+1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  const todayKey = mm+'-'+dd;

  // If today has an entry, show it (rotates through nearby dates every 8hrs)
  // If not, show a clearly-labeled historical event with its actual date
  const allKeys = Object.keys(ON_THIS_DAY).sort();
  const period8 = Math.floor(Date.now() / (8 * 60 * 60 * 1000));

  if (ON_THIS_DAY[todayKey]) {
    // Today has an exact match — show it
    return { ...ON_THIS_DAY[todayKey], date: 'Today in ' + fmtYear(ON_THIS_DAY[todayKey].y) };
  } else {
    // No entry for today — pick a random historical event, clearly labeled with its real date
    const idx = period8 % allKeys.length;
    const key = allKeys[idx];
    const entry = ON_THIS_DAY[key];
    const [m, d] = key.split('-');
    const dateLabel = new Date(2000, parseInt(m)-1, parseInt(d))
      .toLocaleDateString('en-US', {month:'long', day:'numeric'});
    return { ...entry, date: dateLabel + ', ' + fmtYear(entry.y) };
  }
}



// ── DIY SEASONAL DATA ──────────────────────────────────────────────────────
const DIY_SEASONS = [
  {
    key: 'winter',
    months: [12, 1, 2],
    accent: '#3b82f6',
    icon: '❄️',
    label: 'Winter · Dec – Feb',
    heading: 'Cold Weather Priorities',
    content: `<b>Monthly:</b> Check/replace furnace filter · Test smoke &amp; CO detectors · Check for ice dams<br><br>
<b>December:</b> Insulate exposed pipes · Check weatherstripping on doors/windows · Stock emergency supplies (flashlights, batteries, generator fuel) · Service snowblower<br><br>
<b>January:</b> Check attic insulation for heat loss · Inspect crawl space for moisture/freezing · Keep cabinet doors open under sinks in freezing temps<br><br>
<b>February:</b> Schedule HVAC spring tune-up · Check roof for ice damage · Inspect basement walls for cracks from freeze/thaw cycles`
  },
  {
    key: 'spring',
    months: [3, 4, 5],
    accent: '#22c55e',
    icon: '🌱',
    label: 'Spring · Mar – May',
    heading: 'Post-Winter Inspection',
    content: `<b>Monthly:</b> Test smoke &amp; CO detectors · Check HVAC filter · Inspect for pest activity<br><br>
<b>March:</b> Inspect roof for winter damage (missing shingles, flashing) · Clean gutters of winter debris · Check exterior caulking and siding · Test sump pump before rain season<br><br>
<b>April:</b> Service AC unit — clean condenser coils, check refrigerant · Flush water heater of sediment · Check deck/patio for winter heaving · Inspect driveway for cracks<br><br>
<b>May:</b> Clean dryer vent duct · Check and clean window screens · Turn on irrigation, inspect for leaks · Reseed bare lawn patches · Trim trees away from house`
  },
  {
    key: 'summer',
    months: [6, 7, 8],
    accent: '#f97316',
    icon: '☀️',
    label: 'Summer · Jun – Aug',
    heading: 'Peak Season Upkeep',
    content: `<b>Monthly:</b> Check AC filter (monthly in heavy use) · Inspect for pest entry points · Check irrigation system<br><br>
<b>June:</b> Deep clean refrigerator coils · Inspect and clean bathroom exhaust fans · Check exterior paint for peeling · Seal deck/wood surfaces<br><br>
<b>July:</b> Check attic for proper ventilation and heat buildup · Inspect window &amp; door seals · Clean range hood filters · Lubricate garage door hardware<br><br>
<b>August:</b> Flush and inspect water heater anode rod · Snake main sewer line (annual preventive) · Schedule chimney inspection before fall · Check caulking around tubs/showers`
  },
  {
    key: 'fall',
    months: [9, 10, 11],
    accent: '#a16207',
    icon: '🍂',
    label: 'Fall · Sep – Nov',
    heading: 'Pre-Winter Prep',
    content: `<b>Monthly:</b> Replace furnace filter · Test smoke &amp; CO detectors · Check weatherstripping<br><br>
<b>September:</b> Clean and store outdoor furniture · Drain and winterize irrigation system · Inspect roof before winter · Check attic insulation levels · Service heating system<br><br>
<b>October:</b> Clean gutters after leaf fall · Drain outdoor hose bibs and shut off valves · Caulk exterior gaps and cracks · Reverse ceiling fans clockwise for heat retention · Check fireplace damper and chimney cap<br><br>
<b>November:</b> Insulate pipes in unheated spaces · Check sump pump before ground freezes · Test generator · Stock emergency kit · Arrange snow removal service if needed`
  },
];

function getCurrentSeason(month) {
  return DIY_SEASONS.find(s => s.months.includes(month));
}

function renderDIYSeasons() {
  const grid = document.getElementById('diy-seasons-grid');
  if (!grid) return;
  const month = new Date().getMonth() + 1;
  const currentIdx = DIY_SEASONS.findIndex(s => s.months.includes(month));
  // Rotate so current season is first
  const ordered = [
    ...DIY_SEASONS.slice(currentIdx),
    ...DIY_SEASONS.slice(0, currentIdx)
  ];
  grid.className = 'grid';
  grid.innerHTML = ordered.map((s, i) => `
    <div class="nc" style="--ac:${s.accent}${i === 0 ? ';box-shadow:0 0 0 2px ' + s.accent + '40' : ''}">
      <div class="ct">${s.icon} ${s.label}${i === 0 ? ' · <b style=\"color:'+s.accent+'\">Current</b>' : ''}</div>
      <div class="ch">${s.heading}</div>
      <div class="cs" style="-webkit-line-clamp:unset;overflow:visible;font-size:.8rem;line-height:1.6">${s.content}</div>
    </div>`).join('');
}

// Home page seasonal tip
function getHomeSeasonCard() {
  const month = new Date().getMonth() + 1;
  const season = getCurrentSeason(month);
  if (!season) return '';
  const lines = season.content.replace(/<br><br>/g,'|').replace(/<[^>]+>/g,'').split('|');
  const tip = lines[0] || '';
  return '<div style="background:var(--card-bg);border:1px solid var(--rule);border-radius:3px;padding:14px 18px;border-left:3px solid '+season.accent+';margin-top:8px">'
    + '<div style="font-size:.62rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:'+season.accent+';margin-bottom:4px">'+season.icon+' '+season.label+' · Home Maintenance</div>'
    + '<div style="font-size:.82rem;color:#444;line-height:1.55">'+tip+'</div>'
    + '</div>';
}

function initHome() {
  const now = new Date();
  const hour = now.getHours();

  // Rotating time-aware greetings — pool per time window, picked every 4hrs
  const GREETINGS = {
    morning: [
      'Good morning, Thomas',
      'Rise and grind, Thomas — the firewall won\'t manage itself',
      'Morning, Thomas. Coffee first, packets second',
      'The early bird gets the threat intel',
      'Good morning — the CISSP exam isn\'t going to pass itself',
      'Wakey wakey, Thomas. The adversary started 3 hours ago',
      'Morning. Today\'s a good day to segment something',
      'Salutations and good tidings on this fine morning, Thomas',
      'Good morning — G-Mac\'s not going to out-train himself either',
      'Top of the morning, Thomas. Let\'s build something today',
      'Morning briefing commencing. Threat level: coffee required',
      'Good morning. The logs from last night aren\'t going to read themselves',
    ],
    afternoon: [
      'Good afternoon, Thomas',
      'Afternoon check-in. How\'s the zero trust journey going?',
      'Post-lunch situational awareness restored, Thomas',
      'Good afternoon — hope the morning tickets weren\'t too spicy',
      'Afternoon, Thomas. The network perimeter called. It says it\'s dead',
      'Good afternoon. You\'ve survived the morning. Impressive',
      'Greetings, afternoon Thomas. A different man than morning Thomas',
      'The sun is past the meridian and you\'re still at it. Respect',
      'Afternoon, Thomas. Somewhere G-Mac is doing wall sits right now',
      'Good afternoon — the CISSP domains aren\'t going to memorize themselves',
      'Mid-afternoon intelligence report: you\'re still here. Well done',
      'Bonjour, Thomas. Oui, it is the afternoon',
    ],
    evening: [
      'Good evening, Thomas',
      'Evening, Thomas. Time to close the loop on today\'s incidents',
      'Good evening — hope the day\'s threat surface was manageable',
      'Evening. The network sleeps. You, apparently, do not',
      'Good evening, Thomas. Dinner first, then maybe one more domain',
      'Evening briefing initiated. Status: survived another day',
      'Ah, evening — when the real security work begins',
      'Good evening, Thomas. The firewall held. Today',
      'Evening. G-Mac better be in recovery mode by now',
      'Welcome to the evening shift, Thomas',
      'Good evening — one more CISSP chapter before bed?',
      'The day winds down. The threat actors do not. Good evening',
    ],
    late: [
      'Working late, Thomas',
      'You\'re still here. The network appreciates your dedication',
      'Late night ops. Respect',
      'Thomas. Go to sleep. The logs will be here in the morning',
      'It\'s late. The threat actors thank you for your service hours',
      'Night owl mode activated, Thomas',
      'Sleep is a performance enhancer. Just saying',
      'Late night session detected. Hydration status: unknown',
      'The CISSP exam does not require sleep deprivation. But here we are',
      'Burning the midnight oil, Thomas. Classic',
      'System check: human operator running low on sleep. Recommend reboot',
      'G-Mac is asleep. You should be too. But here we are',
    ],
  };

  let pool;
  if (hour >= 5 && hour < 12)       pool = GREETINGS.morning;
  else if (hour >= 12 && hour < 17) pool = GREETINGS.afternoon;
  else if (hour >= 17 && hour < 21) pool = GREETINGS.evening;
  else                              pool = GREETINGS.late;

  document.getElementById('home-greeting').textContent = pickPeriod4(pool, 7);

  // Date
  document.getElementById('home-date-full').textContent =
    now.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'});

  // Quote — local QUOTES pool, rotates every 8 hours
  const q = pickPeriod8(QUOTES, 1);
  document.getElementById('home-quote-text').textContent = '\u201c' + q.t + '\u201d';
  document.getElementById('home-quote-attr').textContent = '\u2014 ' + q.a;


  // Fact — offset by 1 period so it differs from quote
  const f = pickPeriod8(FACTS.slice().reverse(), 3);
  document.getElementById('home-fact-text').textContent = f;

  // On This Day — still date-based, changes daily
  const hist = getTodayHistory();
  document.getElementById('home-history-text').textContent = hist.e;
  document.getElementById('home-history-year').textContent = hist.date || fmtYear(hist.y);

  // Home seasonal maintenance card
  const seasonCard = document.getElementById('home-season-card');
  if (seasonCard) seasonCard.innerHTML = getHomeSeasonCard();
}

// HOME TABS CONFIG for pulling top story
const HOME_TABS = [
  {key:'it',  label:'💻 IT',           accent:'var(--ca)',  tab:'it'},
  {key:'net', label:'🌐 Networking',   accent:'var(--na)',  tab:'net'},
  {key:'sec', label:'🔐 Cybersecurity',accent:'var(--sea)', tab:'sec'},
  {key:'ot',  label:'🏭 Industrial OT',accent:'var(--oa)',  tab:'ot'},
  {key:'hc',  label:'🏥 Healthcare',   accent:'var(--hca)', tab:'hc'},
  {key:'fin', label:'💼 Finance & Reg',accent:'var(--fa)',  tab:'fin'},
  {key:'training',label:'💪 Training', accent:'var(--ta)',  tab:'training'},
  {key:'mw',   label:'💰 Money',        accent:'var(--mwa)', tab:'mw'},
  {key:'diy',  label:'🏠 Home & DIY',   accent:'var(--diya)',tab:'diy'},
  {key:'tv',   label:'✈️ Travel',       accent:'var(--tva)', tab:'tv'},
  {key:'golf', label:'⛳ Golf',          accent:'var(--ga)',  tab:'golf'},
  {key:'ai',   label:'🤖 AI & Dev',    accent:'var(--aia)', tab:'ai'},
  {key:'ltc',  label:'📚 Learn to Code',accent:'var(--ltca)',tab:'ltc'},
  {key:'cissp',label:'🎓 CISSP',       accent:'var(--csa)', tab:'cissp'},
];

async function loadHomeHeadlines(force=false) {
  const btn = document.getElementById('home-fetch-btn');
  btn.classList.add('loading'); btn.disabled = true;

  // Show skeletons
  document.getElementById('home-grid').innerHTML = HOME_TABS.map(t => `
    <div class="home-card home-card-sk" style="--hac:${t.accent}">
      <div class="sk-line s" style="margin-bottom:8px"></div>
      <div class="sk-line"></div>
      <div class="sk-line m"></div>
    </div>`).join('');

  // Fetch top story from each tab's first feed
  const picks = await Promise.all(HOME_TABS.map(async t => {
    const feeds = NEWS_FEEDS[t.key];
    if (!feeds || !feeds.length) return {tab: t, cands: []};
    // Try feeds in order until we get a result
    for (const feed of feeds) {
      try {
        const items = await getFeedItems(feed.url, force);
        if (items.length) {
          // Rank this feed's items by keyword score; strict tabs need a match,
          // otherwise try the next feed.
          const ranked = KEYWORDS[t.key]
            ? items.map(i => ({i, sc: kwScore(i.title + ' ' + (i.description||''), t.key)}))
                   .filter(x => x.sc > 0 || !STRICT_TABS.has(t.key))
                   .sort((a, b) => b.sc - a.sc).map(x => x.i)
            : items;
          if (!ranked.length) continue;
          return {tab: t, cands: ranked.slice(0, 5).map(item => ({
            headline: esc(item.title || 'Untitled'),
            link: esc(safeUrl(item.link)),
            source: esc(feed.label),
            date: esc(fmtDate(item.pubDate))
          }))};
        }
      } catch {}
      if (isRateLimited()) break; // don't keep hammering the service
    }
    return {tab: t, cands: []};
  }));
  // Pick each card's best story that isn't already shown on another card
  const usedHeadlines = new Set();
  const results = picks.map(({tab, cands}) => {
    const item = cands.find(c => !usedHeadlines.has(c.headline)) || null;
    if (item) usedHeadlines.add(item.headline);
    return {tab, item};
  });

  document.getElementById('home-grid').innerHTML = results.map(({tab: t, item}) => {
    if (!item) return `
      <div class="home-card" style="--hac:${t.accent}">
        <div class="home-card-tab">${t.label}</div>
        <div class="home-card-hl" style="color:var(--muted);font-family:'Inter',sans-serif;font-size:.82rem">${isRateLimited()?'Feed service busy — try again in a few minutes':'No story loaded'}</div>
      </div>`;
    return `
      <a class="home-card" href="${item.link}" target="_blank" rel="noopener" style="--hac:${t.accent}">
        <div class="home-card-tab">${t.label}</div>
        <div class="home-card-hl">${item.headline}</div>
        <div class="home-card-src">${item.source} · ${item.date}</div>
      </a>`;
  }).join('');

  btn.classList.remove('loading'); btn.disabled = false;
  btn.querySelector('.bl').textContent = 'Refresh Headlines';
}

document.getElementById('home-fetch-btn').addEventListener('click', () => loadHomeHeadlines(true));
initHome();
// Auto-load the default tab on page open
activateTab('home');
renderDIYSeasons();



// ── ROTATING TAGLINES ─────────────────────────────────────────────────────
const TAGLINES = [
  'Your daily command center.',
  'Stay sharp. Stay informed.',
  'Everything that matters. Nothing that doesn\'t.',
  'Built for the curious and the driven.',
  'Intelligence without the noise.',
  'Security. Training. Life. All of it.',
  'Know more. Do more.',
  'Your edge, delivered daily.',
  'For those who never stop learning.',
  'Signal over noise. Always.',
];

(function() {
  const KEY_ORDER = 'mcgrid_tagline_order';
  const KEY_IDX   = 'mcgrid_tagline_idx';
  const PERIOD    = 12 * 60 * 60 * 1000; // 12 hours in ms

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getTagline() {
    try {
    let order = JSON.parse(localStorage.getItem(KEY_ORDER) || 'null');
    if (!Array.isArray(order) || order.length !== TAGLINES.length ||
        order.some(i => !Number.isInteger(i) || i < 0 || i >= TAGLINES.length)) order = null;
    let idx   = parseInt(localStorage.getItem(KEY_IDX)   || '0') || 0;
    if (idx < 0) idx = 0;
    const period = Math.floor(Date.now() / PERIOD);

    // If no order yet or idx went past end, generate a fresh shuffle
    if (!order || idx >= order.length) {
      order = shuffle(TAGLINES.map((_, i) => i));
      idx   = 0;
      localStorage.setItem(KEY_ORDER, JSON.stringify(order));
    }

    // Advance index once per 12hr period (store period so we only advance once)
    const lastPeriod = parseInt(localStorage.getItem('mcgrid_tagline_period') || '0') || 0;
    if (period > lastPeriod) {
      idx = (idx + 1) % order.length;
      if (idx === 0) {
        // Exhausted all — reshuffle for next cycle
        order = shuffle(TAGLINES.map((_, i) => i));
      }
      localStorage.setItem(KEY_ORDER, JSON.stringify(order));
      localStorage.setItem(KEY_IDX, String(idx));
      localStorage.setItem('mcgrid_tagline_period', String(period));
    }

    return TAGLINES[order[idx]] || TAGLINES[period % TAGLINES.length];
    } catch {
      // storage blocked or corrupt: rotate by time instead
      return TAGLINES[Math.floor(Date.now() / PERIOD) % TAGLINES.length];
    }
  }

  const tag = getTagline();
  const el  = document.getElementById('sb-tagline');
  const el2 = document.getElementById('mob-tagline');
  if (el)  el.textContent  = tag;
  if (el2) el2.textContent = tag;
})();

// ── INIT ──────────────────────────────────────────────────────────────────
['it','net','sec','ot','hc','fin','training','mw','ai','ltc','diy','tv','golf','cissp'].forEach(key=>{
  document.getElementById('pod-'+key).innerHTML = renderStaticPods(key);
});

document.querySelectorAll('.fetch-btn').forEach(btn=>{
  btn.addEventListener('click',()=>fetchPanel(btn.dataset.panel,true));
});

document.querySelectorAll('.sb-btn').forEach(btn=>{
  btn.addEventListener('click',()=>activateTab(btn.dataset.tab));
});

document.querySelectorAll('.plb').forEach(btn=>{
  btn.addEventListener('click', async()=>{
    const key = btn.dataset.pod;
    btn.classList.add('loading'); btn.disabled=true;
    const el = document.getElementById('pod-'+key);
    el.innerHTML=`<div class="state-box"><span class="si" style="font-size:1.4rem">⏳</span><p>Loading latest episodes...</p></div>`;
    try{
      const res = await fetchPodEpisodes(key);
      el.innerHTML = res.html;
      if(!res.live) throw new Error('no live episodes');
      btn.classList.remove('loading');
      btn.innerHTML='✓ Live Episodes';
      const accent = {it:'var(--ca)',net:'var(--na)',sec:'var(--sea)',ot:'var(--oa)',hc:'var(--hca)',fin:'var(--fa)',training:'var(--ta)',mw:'var(--mwa)',ai:'var(--aia)',ltc:'var(--ltca)',diy:'var(--diya)',tv:'var(--tva)',golf:'var(--ga)',cissp:'var(--csa)'}[key];
      btn.style.color=`color-mix(in srgb, ${accent} 100%, transparent)`;
      btn.style.borderColor=`color-mix(in srgb, ${accent} 100%, transparent)`;
    }catch{
      el.innerHTML=renderStaticPods(key);
      btn.classList.remove('loading'); btn.disabled=false;
      btn.innerHTML='<div class="sp"></div>' + (isRateLimited() ? 'Feed service busy — retry later' : 'No new episodes — retry');
    }
  });
});
// Tabs whose shows have no RSS feed can't load episodes: hide the button there.
document.querySelectorAll('.plb').forEach(btn=>{
  if(!(PODS_STATIC[btn.dataset.pod]||[]).some(p=>p.rss)) btn.hidden = true;
});

// ── MOBILE HAMBURGER ──────────────────────────────────────────────────────
function openDrawer() {
  document.getElementById('mob-drawer').classList.add('open');
  document.getElementById('mob-overlay').classList.add('open');
  document.getElementById('mob-hamburger').classList.add('open');
}
function closeDrawer() {
  document.getElementById('mob-drawer').classList.remove('open');
  document.getElementById('mob-overlay').classList.remove('open');
  document.getElementById('mob-hamburger').classList.remove('open');
}
var mobHamburger = document.getElementById('mob-hamburger');
var mobClose = document.getElementById('mob-close');
var mobOverlay = document.getElementById('mob-overlay');
if(mobHamburger) mobHamburger.addEventListener('click', openDrawer);
if(mobClose) mobClose.addEventListener('click', closeDrawer);
if(mobOverlay) mobOverlay.addEventListener('click', closeDrawer);
document.querySelectorAll('.mob-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.mob-btn,.sb-btn,.tab-btn').forEach(function(b){b.classList.remove('active');});
    btn.classList.add('active');
    activateTab(btn.dataset.tab);
    closeDrawer();
  });
});
var mobDate = document.getElementById('mob-date');
if(mobDate) mobDate.textContent = now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
