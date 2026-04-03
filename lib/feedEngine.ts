/**
 * Feed Engine — TikTok-style diversified reel feed
 *
 * Strategy:
 *  1. Map search query → pool of subreddits
 *  2. Fetch all subs in parallel (batched)
 *  3. Shuffle each sub's reels independently
 *  4. Weighted round-robin merge (personalization boosts frequency)
 *  5. Enforce no-consecutive-same-subreddit constraint
 */

import type { ReelPost } from '@/app/api/reddit/route';

/* ─────────────────────────────────────────────────────────────
   Query → Subreddit pool mapping (ALL subreddits from reddit_communities.json)
───────────────────────────────────────────────────────────── */
const TOPIC_MAP: Record<string, string[]> = {
  animals: ['aww','AnimalsBeingJerks','AnimalsBeingBros','NatureIsFuckingLit','rarepuppers','cats','dogs','Zoomies','wildlifephotography','startledcats','corgi','babyelephantgifs','Eyebleach','hardcoreaww','likeus','AnimalsBeingDerps','bigboye','Floof','catgifs','dogpictures','puppies','babycorgis','IllegallySmolCats','tuckedinkitties','SupermodelCats','tippytaps','kittens','Awwducational','AnimalsBeingDerps','stoppedworking','hitmanimals','animaltextgifs','BeforeNAfterAdoption','sneks','TsundereSharks','whatsthisbug','HybridAnimals','brushybrushy','mlem','shittyanimalfacts','animalsthatlovemagic','spiderbro','properanimalnames','animalsdoingstuff','sploot'],
  cats: ['cats','startledcats','catpictures','catsstandingup','catpranks','meow_irl','holdmycatnip','catslaps','thecatdimension','babybigcatgifs','catloaf','thisismylifemeow','cattaps','teefies','tuckedinkitties','catsareassholes','stuffoncats','bigcatgifs','jellybeantoes','catsareliquid','catgifs','blackcats','supermodelcats','chonkers','catswithjobs','catswhoyell','whatswrongwithyourcat','illegallysmolcats'],
  dogs: ['dogs','dogpictures','dogtraining','woof_irl','WhatsWrongWithYourDog','dogberg','dogswithjobs','masterreturns','barkour','blop','puppysmiles','puppies','petthedamndog','corgi','Pitbulls','goldenretrievers','incorgnito','babycorgis'],
  birds: ['birdswitharms','superbowl','birbs','partyparrot','birdsbeingdicks','birdsarentreal'],
  funny: ['funny','Unexpected','instant_regret','therewasanattempt','facepalm','maybemaybemaybe','holdmybeer','AbruptChaos','youseeingthisshit','ContagiousLaughter','ChildrenFallingOver','Wellthatsucks','prematurecelebration','WatchPeopleDieInside','instantkarma','PublicFreakout','ActualPublicFreakouts','humor','standupcomedy','ProgrammerHumor','dadreflexes','kenm','politicalhumor','accidentalcomedy','funnyandsad','kidsarefuckingstupid','suspiciouslyspecific','oddlyspecific','rimjob_steve','dark_humor','stepdadreflexes','congratslikeimfive','darkhumorandmemes'],
  jokes: ['Jokes','dadjokes','standupshots','punny','antijokes','meanjokes','3amjokes','puns','WordAvalanches','darkjokes'],
  comedy: ['ComedyCemetery','comedyheaven','comedynecromancy','comedyhomicide'],
  gaming: ['gaming','GamePhysics','PS5','XboxSeriesX','pcmasterrace','Minecraft','GTA','gifsofgaming','gamedev','Games','IndieGaming','patientgamers','truegaming','retrogaming','gamingsuggestions','ShouldIbuythisgame','Steam','playstation','xbox','NintendoSwitch','pcgaming','gaming4gamers','gamernews','DnD','DnDGreentext','DnDBehindTheScreen','dndnext','dungeonsanddragons','criticalrole','DMAcademy','dndmemes','magicTCG','modernmagic','magicarena','zombies','cyberpunk','fantasy','lego','boardgames','rpg','chess','poker','jrpg'],
  sports: ['sports','nba','soccer','nfl','cricket','MMA','hockey','baseball','tennis','formula1','running','bicycling','golf','skiing','skateboarding','snowboarding','CFB','fantasyfootball','Boxing','ufc','squaredcircle','sportsarefun','rugbyunion','discgolf','sailing','fishing'],
  football: ['nfl','CFB','fantasyfootball','nflstreams','patriots','eagles','greenbaypackers','minnesotavikings','losangelesrams'],
  basketball: ['nba','collegebasketball','nbastreams','fantasybball','warriors','lakers','bostonceltics','torontoraptors','sixers','chicagobulls'],
  soccer: ['soccer','worldcup','Bundesliga','futbol','soccerstreams','MLS','fantasypl','gunners','reddevils','LiverpoolFC','chelseafc'],
  cars: ['IdiotsInCars','Roadcam','dashcam','cars','carporn','Justrolledintotheshop','AutoDetailing','formula1','Autos','projectcar','cartalk','motorcycles','Shitty_Car_Mods','dashcamgifs','teslamotors','bmw','subaru','autos','roadcam','awesomecarmods','roadtrip','jeep','Nascar'],
  music: ['Music','WeAreTheMusicMakers','listentothis','guitar','piano','hiphopheads','EDM','Metal','beatmakers','concerts','vinyl','electronicmusic','Jazz','indieheads','trap','classicalmusic','musictheory','spotify','mashups','futurebeats','guitarlessons','fakealbumcovers','ableton','kanye','radiohead','KendrickLamar','gorillaz','frankocean','donaldglover','eminem','brockhampton','beatles','deathgrips','pinkfloyd','dubstep','edmproduction','Metalcore','spop','kpop','funkopop','popheads','bass','drums'],
  tech: ['technology','programming','webdev','ProgrammerHumor','Futurology','compsci','softwaregore','techsupportgore','MachineLearning','learnprogramming','coding','Python','javascript','dataisbeautiful','gadgets','Android','apple','buildapc','internetisbeautiful','netsec','gamedev','design','engineering','jailbreak','tech','hacking','privacy','torrents','networking','piracy','virtualreality','opensource','unixporn','3Dprinting','functionalprint','nintendo','spacex','nasa','amd','nvidia','photoshop','firefox','AndroidApps','AndroidGaming','AndroidDev','AndroidThemes','oneplus','iphone','mac','ipad','applewatch','raspberry_pi','electronics','arduino','gopro','blender','amazonecho','RetroPie','hardware','hardwareswap','google','chromecast','googlepixel','googlehome','linux','linux_gaming','linux4noobs','linuxmasterrace','archlinux','Windows10','windows','excel','surface','microsoft','DataHoarder','datascience','Bitcoin','dogecoin','CryptoCurrency','ethereum','ethtrader','btc','litecoin','bitcoinmarkets','cryptomarkets','monero','neo','learnpython','java','unity3d','reactjs','audiophile','headphones','audioengineering'],
  science: ['space','nasa','Astronomy','Physics','chemistry','biology','InterestingAsFuck','Damnthatsinteresting','woahdude','cosmology','Science','AskScience','spacex','astrophotography','everythingscience','geology','cogsci','medicine','SpacePorn','aliens','rockets'],
  cooking: ['GifRecipes','food','Cooking','FoodPorn','BBQ','Baking','MealPrepSunday','AskCulinary','grilling','sushi','recipes','slowcooking','pizza','ramen','EatCheapAndHealthy','cookingforbeginners','sousvide','castiron','foodhacks','shittyfoodporn','eatsandwiches','nutrition','mealtimevideos','WeWantPlates','forbiddensnacks','seriouseats','spicy','breadit','instantpot','veganrecipes','fitmeals','budgetfood','ketorecipes','vegan','intermittentfasting','fasting','HealthyFood','coffee','tea','grilledcheese'],
  nature: ['EarthPorn','NatureIsFuckingLit','wildlifephotography','Waterfalls','SkyPorn','BeachPorn','clouds','DesertPorn','natureporn','camping','hiking','CampingandHiking','backpacking','Outdoors','marijuanaenthusiasts','BotanicalPorn','urbanexploration','survival','homestead','MTB','outdoors','wildernessbackpacking','campinggear','bushcraft','gardening','indoorgarden','ultralight','hardcoreaww','hitmanimals','heavyseas','succulents','mycology','bonsai','houseplants','natureismetal','Natureisbrutal','weathergifs','tropicalweather'],
  art: ['Art','DigitalArt','drawing','painting','Sculpture','Illustration','ConceptArt','graffiti','PixelArt','animation','ArtPorn','ImaginaryLandscapes','Heavymind','wimmelbilder','streetart','learnart','redditgetsdrawn','redditgetsdrawn','heavymind','retrofuturism','sketchdaily','pixelart','artfundamentals','specart','minipainting','alternativeart','glitch_art','CrappyDesign','web_design','graphic_design','designporn','InteriorDesign','ATBGE','dontdeadopeninside','assholedesign','keming','logodesign','dangerousdesign'],
  fitness: ['fitness','bodybuilding','crossfit','running','yoga','bicycling','climbing','weightlifting','GymMotivation','progresspics','loseit','gainit','flexibility','xxfitness','bodyweightfitness','Brogress','GetMotivated','health','ZenHabits','motivation','LucidDreaming','meditation','Psychonaut','mentalhealth','Fitness','fitmeals','paleo','vegetarian','leangains','bjj','WeightRoom','powerlifting','c25k','Medicine','Coronavirus','COVID19','brogress'],
  movies: ['movies','MovieDetails','Moviesinthemaking','TrueFilm','fullmoviesonyoutube','Documentaries','criterion','FanTheories','marvelstudios','DC_Cinematic','StarWars','MovieSuggestions','documentaries','truefilm','bollywoodrealism','moviedetails','fullmoviesonvimeo','continuityporn','ghibli','cinematography','shittymoviedetails','moviescirclejerk','starwars','harrypotter','lotr','lotrmemes','batman','thanosdidnothingwrong','inthesoulstone'],
  tv: ['television','DunderMifflin','rickandmorty','BreakingBad','gameofthrones','freefolk','StrangerThings','TheLastAirbender','community','PandR','IASIP','BobsBurgers','futurama','TheSimpsons','Television','japanesegameshows','shield','cordcutters','offlinetv','tvdetails','GameOfThrones','thewalkingdead','arresteddevelopment','topgear','StarTrek','HIMYM','firefly','Sherlock','BetterCallSaul','TrueDetective','houseofcards','MakingaMurderer','FlashTV','trailerparkboys','mrrobot','siliconvalleyhbo','strangerthings','supernatural','thegrandtour','AmericanHorrorStory','rupaulsdragrace','westworld','blackmirror','FilthyFrank','orangeisthenewblack','twinpeaks','bigbrother','brooklynninenine','scrubs','howyoudoin','30rock','lifeisstrange','survivor','riverdale','letterkenny','Pokemon','AdventureTime','ArcherFX','southpark','mylittlepony','stevenuniverse','BoJackHorseman','gravityfalls','familyguy','kingofthehill','spongebob','dbz','DBZDokkanBattle','dragonballfighterz','doctorwho','gallifrey','IASIP','the_dennis','seinfeld','redditwritesseinfeld','seinfeldgifs','NetflixBestOf','Netflix','bestofnetflix'],
  books: ['books','Fantasy','scifi','booksuggestions','suggestmeabook','52book','literature','writing','WritingPrompts','Poetry','Books','lifeofnorman','poetry','screenwriting','freeEbooks','boottoobig','hfy','lovecraft','comics','comicbooks','polandball','marvel','webcomics','bertstrips','defenders','marvelmemes','avengers','calvinandhobbes','xkcd','DCComics','arrow','unexpectedhogwarts','spiderman','deadpool','KingkillerChronicle','asoiaf','jonwinsthethrone','gameofthronesmemes','daeneryswinsthethrone','asongofmemesandrage','tolkienfans'],
  photography: ['itookapicture','photocritique','photographs','EarthPorn','CityPorn','ExposurePorn','AbandonedPorn','astrophotography','analog','streetphotography','photography','Filmmakers','postprocessing'],
  diy: ['DIY','somethingimade','woodworking','HomeImprovement','crafts','Leathercraft','Blacksmith','metalworking','BeginnerWoodWorking','cosplay','architecture','CoolGuides','WorldBuilding','ifyoulikeblank','DiWHY','knitting','sewing','modelmakers','crochet','ProtectAndServe','digitalnomad','FastWorkers','accounting','preppers','redneckengineering','crossstitch','dumpsterdiving','gunpla','urbanplanning','cubers','toptalent','aquariums','plantedtank','Drawing','fountainpens','calligraphy','handwriting','twosentencehorror','brandnewsentence'],
  cringe: ['cringe','cringepics','sadcringe','Cringetopia','blunderyears','iamverysmart','iamverybadass','niceguys','ChoosingBeggars','insanepeoplefacebook','oldpeoplefacebook','instant_regret','fatlogic','publicfreakout','actualpublicfreakouts','lewronggeneration','fellowkids','corporatefacepalm','4PanelCringe','amibeingdetained','watchpeopledieinside','technicallythetruth','accidentalracism','engrish','wokekids','masterhacker','cringetopia','holup','agedlikemilk','tiktokcringe'],
  calledout: ['facepalm','quityourbullshit','thathappened','delusionalartists','murderedbywords','woooosh','boneappletea','iamatotalpieceofshit','suicidebywords','wowthanksimcured','confidentlyincorrect','rareinsults','clevercomebacks','mallninjashit','gatekeeping','inceltears','nothowdrugswork','virginsvschad','nicegirls','notliketheothergirls','entitledbitch','justneckbeardthings','neckbeardnests','entitledparents','insaneparents','shitmomgroupssay'],
  wholesome: ['wholesomememes','MadeMeSmile','HumansBeingBros','UpliftingNews','aww','Eyebleach','happy','ContagiousLaughter','dadreflexes','AnimalsBeingBros','GetMotivated','QuotesPorn','getdisciplined','productivity','DecidingToBeBetter','mademesmile','selfimprovement','humansbeingbros','GetStudying'],
  memes: ['memes','dankmemes','me_irl','meirl','AdviceAnimals','wholesomememes','PrequelMemes','HistoryMemes','ProgrammerHumor','BikiniBottomTwitter','terriblefacebookmemes','dankchristianmemes'],
  news: ['news','worldnews','nottheonion','UpliftingNews','offbeat','NewsOfTheStupid','NewsOfTheWeird','gamernews','floridaman','truecrime','TheOnion','AteTheOnion'],
  history: ['history','HistoryPorn','AskHistorians','ColorizedHistory','100yearsago','PropagandaPosters','TheWayWeWere','HistoryMemes','ArtefactPorn','AskHistory','badhistory','castles','OldSchoolCool','nostalgia','forwardsfromgrandma','oldphotosinreallife'],
  space: ['space','spacex','nasa','Astronomy','astrophotography','SpacePorn','cosmology','rockets','aliens'],
  cute: ['aww','Eyebleach','rarepuppers','corgi','cats','dogs','puppies','kittens','babyelephantgifs','IllegallySmolCats','tuckedinkitties','SupermodelCats','tippytaps','Awwducational','thisismylifenow','blep','eyebeach','awww'],
  wtf: ['WTF','hmmm','Whatcouldgowrong','instant_regret','Wellthatsucks','oddlyterrifying','MakeMeSuffer','TIHI','cursedimages','blursedimages','DeepIntoYouTube','fifthworldproblems','awwwtf','streetfights','yesyesyesyesno','wtfstockphotos','mildlyinfuriating','crappydesign','rage','gifsthatendtoosoon','makemesuffer','cursedcomments','imgoingtohellforthis','toosoon','trashy','subwaycreatures'],
  satisfying: ['oddlysatisfying','perfectfit','powerwashingporn','LaserCleaningPorn','PerfectTiming','DesignPorn','RoomPorn','CozyPlaces','AbandonedPorn','minimalism','Cinemagraphs','ImaginaryLandscapes','eyebleach','perfectloops','cozyplaces','raining','satisfyingasfuck'],
  internet: ['InternetIsBeautiful','facepalm','wikipedia','creepyPMs','web_design','google','KenM','bannedfromclubpenguin','savedyouaclick','bestofworldstar','discordapp','snaplenses','instagramreality','internetstars','robinhood','shortcuts','scams','tiktokcringe','crackheadcraigslist','4chan','Classic4chan','greentext','oldpeoplefacebook','facebookwins','indianpeoplefacebook','terriblefacebookmemes','Tinder','OkCupid','KotakuInAction','wikileaks','shitcosmosays','twitch','livestreamfail','serialpodcast','podcasts','tumblrinaction','tumblr','blackpeopletwitter','scottishpeopletwitter','WhitePeopleTwitter','wholesomebpt','latinopeopletwitter','YoutubeHaiku','youtube','youngpeopleyoutube'],
  lifestyle: ['LifeProTips','lifehacks','geek','EDC','simpleliving','tinyhouses','rainmeter','vandwellers','UnethicalLifeProTips','vagabond','illegallifeprotips','malelifestyle','malelivingspace','TheGirlSurvivalGuide','homeimprovement','homelab','homeautomation','battlestations','hometheater','teenagers','introvert','ADHD','totallynotrobots','polyamory','teachers','aliensamongus','neverbrokeabone','bipolar','beards','vegan','swoleacceptance','tall','lgbt','gaybros','actuallesbians','gaymers','bisexual','askgaybros','ainbow','gay','gay_irl','asktransgender','transgender','parenting','daddit','babybumps'],
  money: ['PersonalFinance','Entrepreneur','beermoney','startups','finance','economy','financialindependence','realestate','flipping','antimlm','investing','wallstreetbets','millionairemakers','options','pennystocks','frugal','frugalmalefashion','budgetfood','povertyfinance','stocks','stockmarket'],
  fashion: ['makeupaddiction','SkincareAddiction','wicked_edge','RedditLaqueristas','AsianBeauty','piercing','FancyFollicles','malehairadvice','curlyhair','tattoos','badtattoos','tattoo','malefashionadvice','femalefashionadvice','thriftstorehauls','fashion','streetwear','malefashion','supremeclothing','FashionReps','designerreps','sneakers','repsneakers','goodyearwelt'],
  relationships: ['socialskills','socialengineering','weddingplanning','Parenting','childfree','raisedbynarcissists','justnomil','justnofamily','relationships','relationship_advice','dating_advice','breakups','dating','r4r','longdistance','sex','seduction','nofap','deadbedrooms'],
  misc: ['holdmybeer','holdmyjuicebox','holdmyfries','holdmybeaker','holdmycosmo','holdmycatnip','holdmyredbull','fiftyfifty','firstworldproblems','instantkarma','unpopularopinion','nextfuckinglevel','therewasanattempt','notmyjob','sweatypalms','2healthbars','confusing_perspective','collapse','instantregret','whatintarnation','idiotsnearlydying','chaoticgood','firstworldanarchists','unexpectedthuglife','montageparodies','OSHA','hailcorporate','im14andthisisdeep','bollywoodrealism','AccidentalRenaissance','maliciouscompliance','fakehistoryporn','unexpected','UnexpectedThugLife','misleadingthumbnails','unexpectedjihad','slygifs','blackmagicfuckery','unexpectedhogwarts','woahdude','frisson','asmr','VaporwaveAesthetics','glitchinthematrix','conspiracy','skeptic','karmaconspiracy','UFOs','conspiratard','scp','conspiracytheories'],
  gifs: ['gifs','behindthegifs','gif','Cinemagraphs','perfectloops','highqualitygifs','gifsthatkeepongiving','wholesomegifs','noisygifs','bettereveryloop','mechanical_gifs','educationalgifs','chemicalreactiongifs','physicsgifs','babyelephantgifs','blackpeoplegifs','whitepeoplegifs','asianpeoplegifs','reactiongifs','combinedgifs','gifrecipes','WastedGifs','gifsound','retiredgif','michaelbaygifs','gifextra','slygifs','brokengifs','loadingicon','splitdepthgifs','scriptedasiangifs','shittyreactiongifs','weathergifs'],
  videos: ['videos','youtubehaiku','artisanvideos','DeepIntoYouTube','praisethecameraman','killthecameraman','perfectlycutscreams','donthelpjustfilm','abruptchaos','nottimanderic'],
  anime: ['anime','manga','anime_irl','animemes','animegifs','wholesomeanimemes','pokemon','onepiece','naruto','dbz','onepunchman','ShingekiNoKyojin','BokuNoHeroAcademia','hunterxhunter','awwnime','animesuggest','animewallpaper','entertainment','fantheories','Disney','obscuremedia','awwnime','TsundereSharks','yugioh','DDLC','berserk','tokyoghoul','shitpostcrusaders'],
  celebs: ['celebs','celebhub','EmmaWatson','jessicanigri','kateupton','alisonbrie','EmilyRatajkowski','jenniferlawrence','alexandradaddario','onetruegod','joerogan','keanubeingawesome','crewscrew','donaldglover','elonmusk'],
  sfwporn: ['EarthPorn','HistoryPorn','FoodPorn','JusticePorn','AbandonedPorn','SpacePorn','RoomPorn','QuotesPorn','MapPorn','CityPorn','carporn','humanporn','penmanshipporn','militaryporn','DesignPorn','ThingsCutInHalfPorn','ArchitecturePorn','ExposurePorn','futureporn','waterporn','machineporn','animalporn','movieposterporn','illusionporn','destructionporn','adporn','artefactporn','gunporn','skyporn','powerwashingporn','ArtPorn','InfrastructurePorn','shockwaveporn','productporn','macroporn','cabinporn','houseporn','mineralporn','microporn'],
  educational: ['YouShouldKnow','everymanshouldknow','LearnUselessTalents','changemyview','howto','Foodforthought','educationalgifs','lectures','education','college','GetStudying','teachers','watchandlearn','bulletjournal','applyingtocollege','lawschool','todayilearned','wikipedia','OutOfTheLoop','IWantToLearn','explainlikeimfive','explainlikeIAmA','ExplainLikeImCalvin','anthropology','cscareerquestions','EngineeringStudents','askengineers','ubuntu','Economics','business','entrepreneur','marketing','BasicIncome','smallbusiness','environment','zerowaste','linguistics','languagelearning','learnjapanese','french','etymology','law','math','theydidthemath','medicalschool','medizzy','psychology','JordanPeterson'],
  discussion: ['ShowerThoughts','DoesAnybodyElse','crazyideas','howtonotgiveafuck','tipofmytongue','quotes','casualconversation','makenewfriendshere','legaladvice','bestoflegaladvice','advice','amitheasshole','mechanicadvice','toastme','needadvice','IAmA','ExplainlikeIAmA','AMA','casualiama','de_Iama','whowouldwin','wouldyourather','scenesfromahat','AskOuija','themonkeyspaw','shittysuperpowers','godtiersuperpowers','decreasinglyverbose','jesuschristouija','whatisthisthing','answers','NoStupidQuestions','amiugly','whatsthisbug','samplesize','tooafraidtoask','whatsthisplant','isitbullshit','questions','morbidquestions','AskReddit','ShittyAskScience','TrueAskReddit','AskScienceFiction','AskScience','askhistorians','AskHistory','askculinary','AskSocialScience','askphilosophy','askdocs','askwomen','askmen','askgaybros','askredditafterdark','askmenover30','tifu','self','confession','fatpeoplestories','confessions','storiesaboutkevin','talesfromtechsupport','talesfromretail','techsupportmacgyver','idontworkherelady','TalesFromYourServer','KitchenConfidential','TalesFromThePizzaGuy','TalesFromTheFrontDesk','talesfromthecustomer','talesfromcallcenters','talesfromthesquadcar','talesfromthepharmacy','starbucks','pettyrevenge','prorevenge','nuclearrevenge','nosleep','LetsNotMeet','Glitch_in_the_Matrix','shortscarystories','thetruthishere','UnresolvedMysteries','UnsolvedMysteries','depression','SuicideWatch','Anxiety','foreveralone','offmychest','socialanxiety','trueoffmychest','unsentletters','rant'],
  images: ['pics','PhotoshopBattles','perfecttiming','itookapicture','Pareidolia','ExpectationVSReality','dogpictures','misleadingthumbnails','FifthWorldPics','TheWayWeWere','pic','nocontextpics','miniworlds','foundpaper','images','screenshots','mildlyinteresting','interestingasfuck','damnthatsinteresting','beamazed','reallifeshinies','thatsinsane','playitagainsam','gentlemanboners','prettygirls','hardbodies','girlsmirin','goddesses','shorthairedhotties','fitandnatural','wrestlewiththeplot','bois','GentlemanBonersGifs','asiancuties','asiangirlsbeingcute','ColorizedHistory','reallifedoodles','HybridAnimals','colorization','roastme','rateme','uglyduckling','prettygirlsuglyfaces','wallpapers','wallpaper','Offensive_Wallpapers'],
  general: ['nextfuckinglevel','oddlysatisfying','interestingasfuck','Damnthatsinteresting','BeAmazed','woahdude','blackmagicfuckery','ThatsInsane','toptalent','BetterEveryLoop','gifsthatkeepongiving','mildlyinteresting','beamazed','reallifeshinies','thatsinsane'],
};

const NSFW_MAP: Record<string, string[]> = {
  default: ['nsfw','nsfw2','nsfwvideos','nsfw_gifs','RealGirls','gonewild','Amateur','NSFW_GIF','BustyPetite','adorableporn','collegesluts','fitgirls','VerticalGifs','bonermaterial','porn','nsfwhardcore','60fpsporn','NSFW_HTML5','iWantToFuckHer','exxxtras','bimbofetish','christiangirls','dirtygaming','sexybutnotporn','femalepov','sexygirls','breedingmaterial','canthold','toocuteforporn','justhotwomen','stripgirls','hotstuffnsfw','uncommonposes','gifsofremoval','nudes','slut','TipOfMyPenis','pornID','spicy99'],
  tiktok: ['tiktoknsfw','tiktokthots','tiktokporn','socialmediasluts','slutsofsnapchat','instagramreality','OnlyFans101','trashyboners','flubtrash','realsexyselfies','nude_selfie'],
  cosplay: ['nsfwcosplay','nsfwcostumes','cosplaybutts','suicidegirls','girlsinschooluniforms'],
  gaming: ['rule34','overwatch_porn','pokeporn','rule34lol','rule34overwatch','ecchi','hentai','hentai_gif','futanari','doujinshi','yiff','furry','monstergirl','rule34_comics','sex_comics','WesternHentai','hentai_irl','traphentai','hentaibondage','bowsette'],
  gym: ['fitgirls','FitNakedGirls','hardbodies','athleticgirls','girlsinyogapants','yogapants','bodyperfection','samespecies','coltish'],
  curvy: ['curvy','thick','gonewildcurvy','voluptuous','SlimThick','thickthighs','juicyasians','amazingcurves','gonewildplus','biggerthanyouthought','jigglefuck','chubby','massivetitsnass','thicker','tightsqueeze','casualjiggles','bbw','gonewildchubby'],
  petite: ['BustyPetite','petitegonewild','dirtysmall','xsmallgirls','funsized','petite','skinnytail','hugedicktinychick'],
  asian: ['AsiansGoneWild','AsianHotties','juicyasians','NSFW_Japan','realasians','nextdoorasians','asianporn','bustyasians','paag','AsianNSFW','javdownloadcenter','kpopfap','NSFW_Korea'],
  indian: ['IndianBabes','indiansgonewild','desiindiansex','IndianHotwife','PuneGWild','MoviePornIndia','Indian_viral_sex','DesiRandi_','IndianCelebScenes','DesiwebseriesVids','IndiNutt','desicreamer','IndianOwnedWomen','Kolkata_wifeswap','mmsbeee','desiSlimnStacked','indian_desi_bdsm','DowntownAnswer7118','BangaloreGW','UnratedPanda','kobeadjordan1','desiporn_addicts','DesiMmsZone','DelhiGone_Wild','indiandesipremium','Alldesiporn','hotwifeindia','IndianHornypeople','indianonlyfans','indianhotwifejunction','desiwomenlove'],
  latina: ['latinas','latinasgw','latinacuties'],
  ebony: ['WomenOfColor','darkangels','ebony','Afrodisiac','blackchickswhitedicks'],
  ginger: ['ginger','redheads'],
  white: ['palegirls','pawg','snowwhites','whooties'],
  amateur: ['realgirls','amateur','homemadexxx','amateurporn','CollegeAmateurs','amateurcumsluts','nsfw_amateurs','verifiedamateurs','dirtypenpals','FestivalSluts','funwithfriends','randomsexiness','normalnudes','ItsAmateurHour','irlgirls','NSFWverifiedamateurs','AmateursDoingIt'],
  cam: ['Camwhores','camsluts','streamersgonewild'],
  gonewild: ['gonewild','PetiteGoneWild','AsiansGoneWild','gonewildcurvy','BigBoobsGW','GWCouples','workgonewild','gwpublic','gonewildstories','GoneWildTube','treesgonewild','gonewildaudio','GWNerdy','gonemild','altgonewild','gifsgonewild','analgw','gonewildsmiles','onstageGW','RepressedGoneWild','bdsmgw','UnderwearGW','LabiaGW','TributeMe','WeddingsGoneWild','assholegonewild','leggingsgonewild','dykesgonewild','goneerotic','snapchatgw','gonewildhairy','gonewildtrans','ratemynudebody','Collegesluts','gonewild30plus','gonewild18','40plusgonewild','gonewildcouples','gwcumsluts','WouldYouFuckMyWife','couplesgonewild','GoneWildplus','bigboobsgonewild','mycleavage','gonewildchubby','gonewildcolor','indiansgonewild','latinasgw','pawgtastic','GoneWildScrubs','swingersgw','militarygonewild','NSFW_Snapchat','snapchat_sluts','snapleaks','wifesharing','hotwife','wouldyoufuckmywife','slutwife','naughtywives'],
  milf: ['milf','gonewild30plus','realmoms','maturemilf','40plusgonewild','preggoporn','agedbeauty'],
  teen: ['legalteens','collegesluts','adorableporn','gonewild18','18_19','legalteensXXX','just18','PornStarletHQ','fauxbait','barelylegalteens'],
  ass: ['ass','asstastic','pawg','paag','bigasses','booty','cutelittlebutts','HungryButts','twerking','facedownassup','assinthong','buttplug','TheUnderbun','hipcleavage','frogbutt','cottontails','lovetowatchyouleave','celebritybutts','cosplaybutts','booty_queens'],
  anal: ['anal','painal','analgw','masterofanal','buttsharpies','asshole','AssholeBehindThong','assholegonewild','spreadem','godasshole'],
  boobs: ['boobies','TittyDrop','boobbounce','hugeboobs','stacked','burstingout','2busty2hide','bigtiddygothgf','BustyPetite','BigBoobsGW','bigboobsgonewild','bigtitsinbikinis','biggerthanherhead','boltedontits','boobs','downblouse','homegrowntits','cleavage','breastenvy','youtubetitties','torpedotits','thehangingboobs','page3glamour','tits','amazingtits','titstouchingtits','pokies','ghostnipples','nipples','puffies','lactation','tinytits','aa_cups','titfuck','clothedtitfuck'],
  pussy: ['pussy','rearpussy','innie','simps','pelfie','LabiaGW','godpussy','presenting','cameltoe','hairypussy','pantiestotheside','breakingtheseal','moundofvenus','pussymound'],
  legs: ['girlsinyogapants','stockings','legs','tightshorts','buttsandbarefeet','feet','datgap','thighhighs','thickthighs','thighdeology'],
  skin: ['Hotchickswithtattoos','sexyfrex','tanlines','oilporn','ComplexionExcellence','SexyTummies','theratio','braceface','GirlswithNeonHair','shorthairchicks','blonde'],
  blowjob: ['blowjobs','deepthroat','GirlsFinishingTheJob','onherknees','lipsthatgrip','blowjobsandwich','iwanttosuckcock'],
  cumsluts: ['cumsluts','cumfetish','amateurcumsluts','GirlsFinishingTheJob','creampies','FacialFun','GirlsFinishingTheJob','cumcoveredfucking','cumhaters','thickloads','before_after_cumsluts','pulsatingcumshots','impressedbycum','throatpies','cumonclothes','oralcreampie','creampie'],
  lesbian: ['lesbians','StraightGirlsPlaying','girlskissing','dykesgonewild','mmgirls','justfriendshavingfun'],
  public: ['holdthemoan','gwpublic','publicflashing','FlashingGirls','realpublicnudity','sexinfrontofothers','ChangingRooms','workgonewild','NotSafeForNature','flashingandflaunting','publicsexporn','nakedadventures'],
  gifs: ['NSFW_GIF','nsfw_gifs','porn_gifs','60fpsporn','verticalgifs','the_best_nsfw_gifs','porninfifteenseconds','CuteModeSlutMode','NSFW_HTML5','besthqporngifs','pornvids','nsfw_videos'],
  hardcore: ['nsfwhardcore','SheLikesItRough','passionx','gangbang','strugglefucking','jigglefuck','whenitgoesin','outercourse','pegging','insertions','xsome','shefuckshim','cuckold','cuckquean','breeding','forcedcreampie','hugedicktinychick','amateurgirlsbigcocks','bbcsluts','facesitting','nsfw_plowcam','pronebone','facefuck','girlswhoride','highresNSFW','incestporn','wincest','incest_gifs'],
  lingerie: ['lingerie','OnOff','stockings','thighhighs','seethru','tightdresses','upskirt','gothsluts','nsfwoutfits','girlswithglasses','collared','sweatermeat','cfnm','nsfwfashion','leotards','whyevenwearanything','shinyporn','bikinis','bikinibridge','bigtitsinbikinis','WtSSTaDaMiT','SchoolgirlSkirts','leggingsgonewild','Bottomless_Vixens','tight_shorts','pantiestotheside','AssholeBehindThong'],
  celeb: ['celebnsfw','WatchItForThePlot','jerkofftocelebs','celebritybutts','extramile','nsfwcelebarchive','celebritypussy','oldschoolcoolNSFW','onoffcelebs','celebswithbigtits','youtubersgonewild','volleyballgirls','Ohlympics'],
  masturbation: ['holdthemoan','O_faces','jilling','gettingherselfoff','quiver','GirlsHumpingThings','forcedorgasms','mmgirls','ruinedorgasms','realahegao','suctiondildos','baddragon','grool','squirting'],
  emotion: ['HappyEmbarrassedGirls','unashamed','borednignored','annoyedtobenude'],
  groups: ['twingirls','groupofnudegirls','Ifyouhadtopickone'],
  professional: ['porn','suicidegirls','GirlsDoPorn','pornstarhq','porninaminute','remylacroix','Anjelica_Ebbi','BlancNoir','rileyreid','tessafowler','lilyivy','mycherrycrush','gillianbarnes','emilybloom','miamalkova','sashagrey','angelawhite','miakhalifa','alexapearl','missalice_18','lanarhoades','evalovia','GiannaMichaels','erinashford','sextrophies','sabrina_nichole','LiyaSilver','MelissaDebling','AdrianaChechik','abelladanger'],
  redditors: ['sarah_xxx','dollywinks','funsizedasian','Kawaiiikitten','legendarylootz','sexyflowerwater','keriberry_420','justpeachyy','hopelesssofrantic'],
  men: ['ladybonersgw','massivecock','chickflixxx','gaybrosgonewild','sissies','penis','monsterdicks','thickdick'],
  trans: ['Tgirls','traps','futanari','gonewildtrans','tgifs','shemales','femboys','transporn'],
  bdsm: ['BDSM','Bondage','bdsmgw','femdom','BDSMcommunity','freeuse','fuckdoll','degradingholes','fuckmeat'],
  other: ['randomactsofblowjob','NSFWFunny','pornhubcomments','confusedboners','dirtykikpals','nsfw_wtf','randomactsofmuffdive','stupidslutsclub','sluttyconfessions','drunkdrunkenporn','dirtysnapchat','damngoodinterracial'],
  gore: ['popping','medicalgore'],
};

export function resolvePool(query: string, nsfw: boolean): string[] {
  const q = query.toLowerCase();

  if (nsfw) {
    if (q.match(/tiktok|snapchat|instagram|social|onlyfans/)) return NSFW_MAP.tiktok;
    
    if (q.match(/cosplay|costume/)) return NSFW_MAP.cosplay;
    if (q.match(/game|gaming|gamer|hentai|anime|rule34|pokemon|overwatch|furry/)) return NSFW_MAP.gaming;
    
    if (q.match(/gym|fit|workout|athletic|muscle/)) return NSFW_MAP.gym;
    if (q.match(/curvy|thick|voluptuous|bbw|chubby/)) return NSFW_MAP.curvy;
    if (q.match(/petite|small|tiny|skinny|slim/)) return NSFW_MAP.petite;
    
    if (q.match(/asian|japan|korea|chinese|thai/)) return NSFW_MAP.asian;
    if (q.match(/indian|desi|bollywood/)) return NSFW_MAP.indian;
    if (q.match(/latina|hispanic|spanish/)) return NSFW_MAP.latina;
    if (q.match(/ebony|black|african/)) return NSFW_MAP.ebony;
    if (q.match(/ginger|redhead/)) return NSFW_MAP.ginger;
    if (q.match(/pale|white/)) return NSFW_MAP.white;
    
    if (q.match(/milf|mom|mature|older|cougar|preggo/)) return NSFW_MAP.milf;
    if (q.match(/teen|young|college|18|19/)) return NSFW_MAP.teen;
    
    if (q.match(/ass|butt|booty|pawg|twerk/)) return NSFW_MAP.ass;
    if (q.match(/boob|tit|breast|busty|cleavage/)) return NSFW_MAP.boobs;
    if (q.match(/pussy|vagina/)) return NSFW_MAP.pussy;
    if (q.match(/leg|feet|foot|thigh/)) return NSFW_MAP.legs;
    
    if (q.match(/blowjob|bj|oral|suck|deepthroat/)) return NSFW_MAP.blowjob;
    if (q.match(/anal/)) return NSFW_MAP.anal;
    if (q.match(/cum|facial|creampie/)) return NSFW_MAP.cumsluts;
    if (q.match(/masturbat|dildo|toy|orgasm/)) return NSFW_MAP.masturbation;
    
    if (q.match(/lesbian|girl on girl|girls kissing/)) return NSFW_MAP.lesbian;
    
    if (q.match(/public|flash|exhib|outdoor/)) return NSFW_MAP.public;
    
    if (q.match(/gif|video|clip/)) return NSFW_MAP.gifs;
    
    if (q.match(/hardcore|rough|gangbang|extreme/)) return NSFW_MAP.hardcore;
    
    if (q.match(/lingerie|underwear|stockings|dress|outfit|yoga pants|goth|bikini/)) return NSFW_MAP.lingerie;
    
    if (q.match(/celeb|celebrity|famous|actress|star/)) return NSFW_MAP.celeb;
    
    if (q.match(/bdsm|bondage|tied|kinky|femdom/)) return NSFW_MAP.bdsm;
    
    if (q.match(/pornstar|professional|porn/)) return NSFW_MAP.professional;
    
    if (q.match(/gay|men|male|cock|penis/)) return NSFW_MAP.men;
    if (q.match(/trans|shemale|trap|femboy/)) return NSFW_MAP.trans;
    
    if (q.match(/cam|webcam|stream/)) return NSFW_MAP.cam;
    
    if (q.match(/gonewild|gw/)) return NSFW_MAP.gonewild;
    if (q.match(/amateur|real|homemade/)) return NSFW_MAP.amateur;
    
    return NSFW_MAP.default;
  }

  if (q.match(/lion|tiger|bear|dog|cat|bird|elephant|whale|shark|wolf|animal|pet|wildlife|puppy|kitten|corgi|cute animal/)) 
    return TOPIC_MAP.animals;
  if (q.match(/^cat|cats|kitten|feline/)) 
    return TOPIC_MAP.cats;
  if (q.match(/^dog|dogs|puppy|canine/)) 
    return TOPIC_MAP.dogs;
  if (q.match(/bird|parrot|owl/)) 
    return TOPIC_MAP.birds;
  if (q.match(/funny|meme|fail|lol|humor|hilarious|comedy|laugh|joke/))   
    return TOPIC_MAP.funny;
  if (q.match(/joke|dad joke|pun/))   
    return TOPIC_MAP.jokes;
  if (q.match(/game|gaming|minecraft|fortnite|cod|valorant|gta|pokemon|xbox|playstation|nintendo|steam|dnd|rpg/)) 
    return TOPIC_MAP.gaming;
  if (q.match(/sport|football|basketball|soccer|cricket|tennis|nba|nfl|hockey|baseball|formula|racing/)) 
    return TOPIC_MAP.sports;
  if (q.match(/^football|nfl/)) 
    return TOPIC_MAP.football;
  if (q.match(/^basketball|nba/)) 
    return TOPIC_MAP.basketball;
  if (q.match(/^soccer|fifa|premier league/)) 
    return TOPIC_MAP.soccer;
  if (q.match(/car|truck|crash|accident|drift|race|ferrari|lamborghini|vehicle|auto|motor/)) 
    return TOPIC_MAP.cars;
  if (q.match(/music|song|concert|guitar|piano|rap|hiphop|rock|metal|jazz|edm|beat/))   
    return TOPIC_MAP.music;
  if (q.match(/code|coding|programming|software|developer|python|javascript|react|web dev|tech|technology/))    
    return TOPIC_MAP.tech;
  if (q.match(/science|space|physics|nasa|rocket|astronomy|chemistry|biology|research/))  
    return TOPIC_MAP.science;
  if (q.match(/food|cook|recipe|bake|chef|restaurant|meal|dish|cuisine/))        
    return TOPIC_MAP.cooking;
  if (q.match(/nature|forest|ocean|mountain|waterfall|landscape|earth|outdoor|hike|camp/)) 
    return TOPIC_MAP.nature;
  if (q.match(/art|draw|paint|creative|design|sketch|illustration|digital art/))        
    return TOPIC_MAP.art;
  if (q.match(/fit|gym|workout|exercise|run|lift|bodybuilding|weight|muscle/))            
    return TOPIC_MAP.fitness;
  if (q.match(/movie|film|cinema|hollywood|actor|director/))
    return TOPIC_MAP.movies;
  if (q.match(/tv|show|series|episode|netflix|hbo/))
    return TOPIC_MAP.tv;
  if (q.match(/book|novel|read|author|literature|story/))
    return TOPIC_MAP.books;
  if (q.match(/photo|photograph|camera|picture|shot/))
    return TOPIC_MAP.photography;
  if (q.match(/diy|craft|build|make|handmade|woodwork/))
    return TOPIC_MAP.diy;
  if (q.match(/cringe|awkward|embarrass/))
    return TOPIC_MAP.cringe;
  if (q.match(/wholesome|heartwarming|uplifting|positive|happy/))
    return TOPIC_MAP.wholesome;
  if (q.match(/meme|dank|shitpost/))
    return TOPIC_MAP.memes;
  if (q.match(/news|current|event|headline/))
    return TOPIC_MAP.news;
  if (q.match(/history|historical|past|ancient|war/))
    return TOPIC_MAP.history;
  if (q.match(/space|spacex|mars|planet|galaxy|universe/))
    return TOPIC_MAP.space;
  if (q.match(/cute|adorable|aww/))
    return TOPIC_MAP.cute;
  if (q.match(/wtf|weird|strange|bizarre/))
    return TOPIC_MAP.wtf;
  if (q.match(/satisfying|satisfy|perfect|clean/))
    return TOPIC_MAP.satisfying;
  if (q.match(/internet|social media|facebook|twitter|reddit/))
    return TOPIC_MAP.internet;
  if (q.match(/money|finance|invest|stock|crypto|bitcoin/))
    return TOPIC_MAP.money;
  if (q.match(/fashion|style|clothes|outfit/))
    return TOPIC_MAP.fashion;
  if (q.match(/relationship|dating|love|marriage/))
    return TOPIC_MAP.relationships;
  if (q.match(/lifestyle|life|living/))
    return TOPIC_MAP.lifestyle;
  if (q.match(/gif|gifs|animated/))
    return TOPIC_MAP.gifs;
  if (q.match(/video|videos|clip/))
    return TOPIC_MAP.videos;
  if (q.match(/anime|manga|japanese animation/))
    return TOPIC_MAP.anime;
  if (q.match(/celeb|celebrity|famous/))
    return TOPIC_MAP.celebs;
  if (q.match(/porn|earthporn|roomporn|cityporn/))
    return TOPIC_MAP.sfwporn;
  if (q.match(/education|learn|teach|study/))
    return TOPIC_MAP.educational;
  if (q.match(/discuss|talk|conversation|story/))
    return TOPIC_MAP.discussion;
  if (q.match(/image|pic|picture|photo/))
    return TOPIC_MAP.images;
    
  return TOPIC_MAP.general;
}

/* ─────────────────────────────────────────────────────────────
   Fisher-Yates shuffle (in-place)
───────────────────────────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ─────────────────────────────────────────────────────────────
   Weighted round-robin merge
   weights: { [subreddit]: number } — higher = more frequent
   Enforces no-consecutive-same-subreddit constraint
───────────────────────────────────────────────────────────── */
export function weightedRoundRobin(
  grouped: Record<string, ReelPost[]>,
  weights: Record<string, number>,
  targetCount: number
): ReelPost[] {
  const buckets: Record<string, ReelPost[]> = {};
  for (const [sub, reels] of Object.entries(grouped)) {
    buckets[sub] = shuffle([...reels]);
  }

  const cursors: Record<string, number> = {};
  for (const sub of Object.keys(buckets)) cursors[sub] = 0;

  const subs = Object.keys(buckets);
  const getWeight = (s: string) => Math.max(weights[s] ?? 1, 0.1);

  const maxWeight = Math.max(...subs.map(getWeight));
  const slots: string[] = [];
  for (const sub of subs) {
    const times = Math.round((getWeight(sub) / maxWeight) * 10);
    for (let i = 0; i < Math.max(times, 1); i++) slots.push(sub);
  }
  shuffle(slots);

  const result: ReelPost[] = [];
  let lastSub = '';
  let slotIdx = 0;
  let attempts = 0;
  const maxAttempts = targetCount * 6;

  while (result.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const sub = slots[slotIdx % slots.length];
    slotIdx++;

    if (sub === lastSub) continue;

    const cursor = cursors[sub];
    const bucket = buckets[sub];
    if (!bucket || cursor >= bucket.length) continue;

    result.push(bucket[cursor]);
    cursors[sub] = cursor + 1;
    lastSub = sub;
  }

  return result;
}

/* ─────────────────────────────────────────────────────────────
   Build personalization weights from UserActivity records
   Counts how many times user engaged with each subreddit
───────────────────────────────────────────────────────────── */
export function buildWeightsFromActivity(
  activities: Array<{ payload: string | null }>
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const act of activities) {
    if (!act.payload) continue;
    try {
      const p = JSON.parse(act.payload) as { subreddit?: string };
      if (p.subreddit) {
        counts[p.subreddit] = (counts[p.subreddit] ?? 1) + 0.5; // incremental boost
      }
    } catch { /* ignore malformed */ }
  }

  for (const sub of Object.keys(counts)) {
    counts[sub] = Math.min(counts[sub], 3);
  }

  return counts;
}
