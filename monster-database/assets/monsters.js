/* 洪荒剑仙 怪物资料库 -- 数据 + 渲染 + 筛选 + 图表 */
var MONSTERS = [
/* 1-10级 */
{n:'杂毛野犬',lv:1,atk:'3~5',def:1,ea:'-',ed:'-',bd:'小',t:'grunt',m:'乱葬岗、丹阳林道、迷雾荒野、乱坟洞、十二陵、瓦当山',s:'yes'},
{n:'分一半',lv:1,atk:'0',def:0,ea:'-',ed:'-',bd:'小',t:'grunt',m:'乱葬岗、丹阳林道、迷雾荒野',s:'yes'},
{n:'全拿走',lv:1,atk:'0',def:0,ea:'-',ed:'-',bd:'小',t:'grunt',m:'乱葬岗、丹阳林道、迷雾荒野',s:'yes'},
{n:'食腐僵尸',lv:3,atk:'4~7',def:3,ea:'-',ed:'-',bd:'中',t:'grunt',m:'乱葬岗、丹阳林道、迷雾荒野、乱坟洞、十二陵、瓦当山、太学村',s:'yes'},
{n:'黑毛野犬',lv:5,atk:'7~14',def:8,ea:'-',ed:'-',bd:'小',t:'grunt',m:'乱坟洞、丹阳林道、十二陵',s:'yes'},
{n:'爆裂僵尸',lv:6,atk:'9~17',def:8,ea:'-',ed:'-',bd:'中',t:'grunt',m:'乱坟洞、十二陵、瓦当山、太学村',s:'yes'},
{n:'刀盾狼兵',lv:6,atk:'9~18',def:15,ea:'-',ed:'-',bd:'中',t:'grunt',m:'落马山、瓦当山',s:'yes'},
{n:'食腐毒僵尸',lv:7,atk:'9~18',def:12,ea:'毒攻3~7',ed:'-',bd:'中',t:'grunt',m:'乱坟洞、十二陵、瓦当山',s:'yes'},
{n:'铁弓狼兵',lv:7,atk:'5~24',def:11,ea:'-',ed:'-',bd:'中',t:'grunt',m:'落马山、瓦当山',s:'yes'},
{n:'锤盾狼兵',lv:8,atk:'11~22',def:21,ea:'-',ed:'-',bd:'中',t:'grunt',m:'落马山',s:'yes'},
{n:'刀盾狼精',lv:9,atk:'12~25',def:24,ea:'-',ed:'-',bd:'中',t:'grunt',m:'百狼窟、狼王洞',s:'yes'},
{n:'狼兵牙将',lv:10,atk:'40~75',def:30,ea:'-',ed:'-',bd:'中',t:'elite',m:'狼王洞',s:'yes'},
{n:'攻城巨犀',lv:10,atk:'45~74',def:30,ea:'-',ed:'-',bd:'大',t:'grunt',m:'凤凰山',s:'yes'},
{n:'锤盾狼精',lv:11,atk:'14~28',def:31,ea:'-',ed:'-',bd:'中',t:'grunt',m:'百狼窟、狼王洞',s:'yes'},
{n:'铁弓狼精',lv:12,atk:'7~34',def:22,ea:'-',ed:'-',bd:'中',t:'grunt',m:'百狼窟、狼王洞、九曲溪谷',s:'yes'},
{n:'幡旗狼精',lv:13,atk:'16~32',def:26,ea:'-',ed:'-',bd:'中',t:'grunt',m:'百狼窟、狼王洞、九曲溪谷',s:'yes'},
{n:'长枪狼精',lv:14,atk:'17~35',def:33,ea:'-',ed:'-',bd:'中',t:'grunt',m:'百狼窟、狼王洞、九曲溪谷',s:'yes'},
{n:'猪精十夫长',lv:14,atk:'31~59',def:30,ea:'-',ed:'-',bd:'大',t:'elite',m:'瓦当山',s:'yes'},
{n:'双镰尸妖',lv:15,atk:'30~58',def:40,ea:'-',ed:'-',bd:'中',t:'grunt',m:'乱坟洞、十二陵',s:'yes'},
/* 16-30级 */
{n:'长枪猫兵',lv:16,atk:'18~45',def:42,ea:'-',ed:'-',bd:'小',t:'grunt',m:'洛水南岸、妖族大营、豹王帅帐',s:'yes'},
{n:'飞刀猫兵',lv:17,atk:'10~48',def:47,ea:'-',ed:'-',bd:'小',t:'grunt',m:'洛水南岸、妖族大营、豹王帅帐、太学村',s:'yes'},
{n:'长枪狼兵头目',lv:17,atk:'34~75',def:54,ea:'-',ed:'-',bd:'中',t:'elite',m:'狼王密巢',s:'yes'},
{n:'锤盾狼兵头目',lv:17,atk:'30~58',def:60,ea:'-',ed:'-',bd:'中',t:'elite',m:'狼王密巢',s:'yes'},
{n:'刀盾狼兵头目',lv:17,atk:'30~58',def:60,ea:'-',ed:'-',bd:'中',t:'elite',m:'狼王密巢',s:'yes'},
{n:'幡旗狼兵头目',lv:17,atk:'28~70',def:48,ea:'-',ed:'-',bd:'中',t:'elite',m:'狼王密巢',s:'yes'},
{n:'铁弓狼兵头目',lv:17,atk:'20~70',def:48,ea:'火攻4~9',ed:'-',bd:'中',t:'elite',m:'狼王密巢',s:'yes'},
{n:'铁爪猫兵',lv:18,atk:'21~42',def:49,ea:'-',ed:'-',bd:'小',t:'grunt',m:'九曲溪谷、洛水南岸、妖族大营、豹王帅帐、太学村',s:'yes'},
{n:'长枪猫妖',lv:19,atk:'21~52',def:49,ea:'-',ed:'-',bd:'小',t:'grunt',m:'午桥庄',s:'yes'},
{n:'飞刀猫妖',lv:20,atk:'13~54',def:55,ea:'-',ed:'-',bd:'小',t:'grunt',m:'九曲溪谷、午桥庄',s:'yes'},
{n:'妖王护卫',lv:20,atk:'42~84',def:58,ea:'-',ed:'-',bd:'中',t:'elite',m:'镇妖洞',s:'yes'},
{n:'号角猫妖',lv:21,atk:'20~40',def:57,ea:'-',ed:'-',bd:'小',t:'grunt',m:'九曲溪谷、妖族大营、午桥庄',s:'yes'},
{n:'狼精校尉',lv:21,atk:'35~70',def:35,ea:'-',ed:'-',bd:'大',t:'elite',m:'百狼窟',s:'yes'},
{n:'铁爪猫妖',lv:22,atk:'25~50',def:60,ea:'-',ed:'-',bd:'小',t:'grunt',m:'午桥庄',s:'yes'},
{n:'近卫呼忽锛',lv:23,atk:'34~68',def:40,ea:'-',ed:'-',bd:'中',t:'elite',m:'百狼窟',s:'yes'},
{n:'近卫突凸墩',lv:23,atk:'27~54',def:63,ea:'-',ed:'-',bd:'大',t:'elite',m:'百狼窟',s:'yes'},
{n:'爆裂毒僵尸',lv:24,atk:'24~48',def:42,ea:'毒攻12~20',ed:'-',bd:'中',t:'grunt',m:'午桥庄、凤凰山',s:'yes'},
{n:'红袍狐妖',lv:25,atk:'7~12',def:50,ea:'火攻20~35',ed:'-',bd:'中',t:'grunt',m:'灵山寺',s:'yes'},
{n:'雄虎蛟',lv:25,atk:'56~100',def:54,ea:'-',ed:'-',bd:'小',t:'grunt',m:'-',s:'yes'},
{n:'小虎蛟',lv:25,atk:'58~110',def:56,ea:'-',ed:'-',bd:'小',t:'grunt',m:'-',s:'yes'},
{n:'主战巨犀',lv:28,atk:'45~75',def:30,ea:'火攻12~24',ed:'-',bd:'大',t:'grunt',m:'狼王洞、凤凰山、灵山寺',s:'yes'},
{n:'掘墓鬼',lv:28,atk:'36~70',def:64,ea:'-',ed:'-',bd:'中',t:'grunt',m:'午桥庄、凤凰山、灵山寺',s:'yes'},
{n:'聒噪鬃',lv:30,atk:'50~100',def:102,ea:'-',ed:'-',bd:'中',t:'grunt',m:'瓦洛道',s:'yes'},
/* 31-40级 */
{n:'黑掘墓鬼',lv:32,atk:'31~62',def:64,ea:'-',ed:'冰防30',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'雌虎蛟',lv:34,atk:'120~220',def:64,ea:'-',ed:'-',bd:'小',t:'grunt',m:'-',s:'yes'},
{n:'狐狸枪兵',lv:34,atk:'30~71',def:70,ea:'-',ed:'冰防30',bd:'中',t:'grunt',m:'云盘雪谷',s:'yes'},
{n:'狐狸弩兵',lv:35,atk:'27~84',def:68,ea:'-',ed:'冰防30',bd:'中',t:'grunt',m:'云盘雪谷',s:'yes'},
{n:'雪地僵尸犬',lv:35,atk:'37~73',def:66,ea:'冰攻22~44',ed:'冰防35',bd:'小',t:'grunt',m:'英纳雪原',s:'yes'},
{n:'双斧傀儡壮汉',lv:35,atk:'42~85',def:65,ea:'-',ed:'冰防20',bd:'大',t:'grunt',m:'英纳雪原',s:'yes'},
{n:'狐狸号兵',lv:36,atk:'31~57',def:70,ea:'-',ed:'冰防30',bd:'中',t:'grunt',m:'云盘雪谷',s:'yes'},
{n:'大锤傀儡壮汉',lv:36,atk:'44~90',def:68,ea:'-',ed:'冰防20',bd:'大',t:'grunt',m:'英纳雪原',s:'yes'},
{n:'僵尸枪兵',lv:36,atk:'35~88',def:78,ea:'-',ed:'-',bd:'中',t:'grunt',m:'桓王墓上层、月剑镇',s:'yes'},
{n:'僵尸弓兵',lv:37,atk:'20~90',def:76,ea:'-',ed:'-',bd:'中',t:'grunt',m:'月剑镇',s:'yes'},
{n:'狐狸步卒',lv:38,atk:'39~79',def:82,ea:'-',ed:'冰防30',bd:'中',t:'grunt',m:'云盘雪谷',s:'yes'},
{n:'僵尸剑卒',lv:39,atk:'47~94',def:89,ea:'-',ed:'-',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'钉耙傀儡壮汉',lv:40,atk:'140~220',def:120,ea:'-',ed:'-',bd:'大',t:'grunt',m:'-',s:'yes'},
{n:'傀儡壮汉屠夫',lv:40,atk:'140~220',def:120,ea:'-',ed:'-',bd:'大',t:'elite',m:'-',s:'yes'},
/* 41-50级 */
{n:'僵尸旗手',lv:41,atk:'40~84',def:85,ea:'-',ed:'-',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'铜甲僵尸枪兵',lv:43,atk:'48~102',def:93,ea:'-',ed:'-',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'铜甲僵尸弓兵',lv:45,atk:'20~93',def:93,ea:'毒攻6~12',ed:'-',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'巨人战士',lv:46,atk:'0',def:100,ea:'冰攻55~100',ed:'冰防50',bd:'大',t:'grunt',m:'十八盘、巨人部落',s:'yes'},
{n:'铜甲僵尸旗手',lv:47,atk:'47~95',def:97,ea:'-',ed:'-',bd:'中',t:'grunt',m:'桓王墓下层',s:'yes'},
{n:'铜甲僵尸剑卒',lv:48,atk:'56~112',def:110,ea:'-',ed:'-',bd:'中',t:'grunt',m:'桓王墓下层',s:'yes'},
{n:'双镰风鼬',lv:48,atk:'0',def:120,ea:'火攻60~120',ed:'火防80',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'长镰风鼬',lv:48,atk:'0',def:120,ea:'冰攻60~120',ed:'毒防80',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'披甲鹿',lv:49,atk:'41~82',def:101,ea:'-',ed:'-',bd:'大',t:'grunt',m:'-',s:'yes'},
{n:'双钩僵尸将军',lv:50,atk:'150~240',def:110,ea:'-',ed:'-',bd:'大',t:'elite',m:'-',s:'yes'},
{n:'大刀僵尸将军',lv:50,atk:'160~280',def:110,ea:'-',ed:'-',bd:'大',t:'elite',m:'-',s:'yes'},
{n:'冰羌族勇士',lv:50,atk:'160~260',def:150,ea:'-',ed:'冰防80',bd:'大',t:'grunt',m:'-',s:'yes'},
/* 51-60级 */
{n:'双镰尸鼬',lv:51,atk:'60~118',def:85,ea:'-',ed:'-',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'长镰尸鼬',lv:53,atk:'60~118',def:89,ea:'-',ed:'-',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'斧头蛮子',lv:53,atk:'52~105',def:88,ea:'-',ed:'冰防40',bd:'中',t:'grunt',m:'十八盘',s:'yes'},
{n:'狐狸精骑兵',lv:54,atk:'63~124',def:112,ea:'-',ed:'-',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'草叉蛮子',lv:54,atk:'48~106',def:90,ea:'-',ed:'冰防40',bd:'中',t:'grunt',m:'十八盘、巨人部落',s:'yes'},
{n:'板斧蛮兵',lv:55,atk:'55~110',def:105,ea:'-',ed:'冰防40',bd:'中',t:'grunt',m:'十八盘',s:'yes'},
{n:'钢叉蛮兵',lv:56,atk:'50~110',def:108,ea:'-',ed:'冰防40',bd:'中',t:'grunt',m:'十八盘、巨人部落',s:'yes'},
{n:'巨人投掷手',lv:56,atk:'54~108',def:86,ea:'-',ed:'冰防50',bd:'大',t:'grunt',m:'巨人部落',s:'yes'},
{n:'水鬼',lv:57,atk:'56~112',def:95,ea:'-',ed:'-',bd:'中',t:'grunt',m:'江陵古渡',s:'yes'},
{n:'火镰尸鼬精',lv:58,atk:'0',def:150,ea:'火攻70~140',ed:'火防80',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'冰镰尸鼬精',lv:58,atk:'0',def:150,ea:'冰攻70~140',ed:'火防80',bd:'中',t:'grunt',m:'-',s:'yes'},
{n:'巨人法师',lv:58,atk:'0',def:100,ea:'冰攻57~114',ed:'冰防80',bd:'大',t:'grunt',m:'十八盘、巨人部落',s:'yes'},
{n:'冰羌族巫傩',lv:60,atk:'0',def:150,ea:'冰攻140~250',ed:'冰防80',bd:'中',t:'elite',m:'-',s:'yes'},
{n:'冰羌族投掷手',lv:60,atk:'0',def:150,ea:'冰攻280~420',ed:'冰防80',bd:'大',t:'grunt',m:'-',s:'yes'},
{n:'蟾精',lv:60,atk:'60~130',def:113,ea:'-',ed:'-',bd:'小',t:'grunt',m:'江陵古渡',s:'yes'},
{n:'火把小妖',lv:60,atk:'10',def:120,ea:'火攻80~130',ed:'火防60',bd:'小',t:'grunt',m:'落星湾、灵石岛',s:'yes'},
{n:'倭猴',lv:60,atk:'60~150',def:118,ea:'-',ed:'-',bd:'小',t:'grunt',m:'平阿镇、殇阳平原',s:'yes'},
/* 61-70级 */
{n:'长棍小妖',lv:61,atk:'10',def:120,ea:'火攻85~135',ed:'火防60',bd:'小',t:'grunt',m:'落星湾、灵石岛',s:'yes'},
{n:'木锨倭猴',lv:61,atk:'90~160',def:118,ea:'-',ed:'-',bd:'小',t:'grunt',m:'平阿镇、殇阳平原',s:'yes'},
{n:'鬼叉蟾精',lv:62,atk:'75~160',def:125,ea:'-',ed:'-',bd:'小',t:'grunt',m:'江陵古渡',s:'yes'},
{n:'夺命蟾精',lv:62,atk:'75~160',def:125,ea:'-',ed:'-',bd:'小',t:'grunt',m:'江陵古渡',s:'yes'},
{n:'火弹小妖',lv:62,atk:'10',def:120,ea:'火攻90~150',ed:'火防60',bd:'小',t:'grunt',m:'落星湾、灵石岛',s:'yes'},
{n:'马勺倭猴',lv:62,atk:'100~165',def:118,ea:'-',ed:'-',bd:'小',t:'grunt',m:'平阿镇、殇阳平原',s:'yes'},
{n:'草叉倭猴',lv:62,atk:'105~160',def:120,ea:'-',ed:'-',bd:'小',t:'grunt',m:'平阿镇、殇阳平原',s:'yes'},
{n:'火把小校',lv:63,atk:'10',def:130,ea:'火攻90~150',ed:'-',bd:'小',t:'grunt',m:'厌火岛',s:'yes'},
{n:'幽魂',lv:63,atk:'30~50',def:110,ea:'毒攻110~160',ed:'火防20冰防20毒防20',bd:'中',t:'grunt',m:'殇阳平原、滕玉墓上层',s:'yes'},
{n:'长棍小校',lv:64,atk:'10',def:130,ea:'火攻100~160',ed:'火防60',bd:'小',t:'grunt',m:'厌火岛',s:'yes'},
{n:'铁镐倭猴',lv:64,atk:'100~165',def:125,ea:'-',ed:'-',bd:'小',t:'grunt',m:'斗野亭',s:'yes'},
{n:'火弹小校',lv:65,atk:'30~60',def:130,ea:'火攻100~170',ed:'火防20冰防20毒防20',bd:'小',t:'grunt',m:'厌火岛',s:'yes'},
{n:'斧头倭猴',lv:65,atk:'150~180',def:110,ea:'毒攻120~170',ed:'火防20冰防20毒防20',bd:'小',t:'grunt',m:'斗野亭',s:'yes'},
{n:'长槊飞猴',lv:66,atk:'120~200',def:130,ea:'-',ed:'-',bd:'偏大中',t:'grunt',m:'蛮古山脉',s:'yes'},
{n:'大棒魔猿',lv:66,atk:'140~180',def:115,ea:'-',ed:'-',bd:'大',t:'grunt',m:'鼎湖山',s:'yes'},
{n:'幡旗飞猴',lv:67,atk:'120~200',def:120,ea:'-',ed:'火防60冰防60',bd:'偏大中',t:'grunt',m:'蛮古山脉',s:'yes'},
{n:'双锤魔猿',lv:67,atk:'100~220',def:110,ea:'-',ed:'-',bd:'大',t:'grunt',m:'鼎湖山',s:'yes'},
{n:'绿毛鬼',lv:67,atk:'100~120',def:130,ea:'-',ed:'-',bd:'中',t:'grunt',m:'滕玉墓下层',s:'yes'},
{n:'倭猴头目',lv:67,atk:'230~290',def:140,ea:'-',ed:'-',bd:'小',t:'elite',m:'斗野亭',s:'yes'},
{n:'长槊飞猴头目',lv:68,atk:'180~260',def:150,ea:'-',ed:'火防60冰防60',bd:'偏大中',t:'elite',m:'雷公岩',s:'yes'},
{n:'招雷飞猴',lv:68,atk:'60~150',def:140,ea:'-',ed:'火防60冰防60',bd:'偏大中',t:'grunt',m:'蛮古山脉',s:'yes'},
{n:'大棒魔猿头目',lv:68,atk:'180~280',def:150,ea:'-',ed:'-',bd:'大',t:'elite',m:'鼎湖山',s:'yes'},
{n:'倭猴象骑兵',lv:68,atk:'230~300',def:160,ea:'-',ed:'-',bd:'大',t:'grunt',m:'蛮古山脉、殇阳平原',s:'yes'},
{n:'幡旗飞猴头目',lv:69,atk:'180~260',def:140,ea:'-',ed:'火防60冰防60',bd:'偏大中',t:'elite',m:'雷公岩',s:'yes'},
{n:'双锤魔猿头目',lv:69,atk:'170~270',def:150,ea:'-',ed:'-',bd:'大',t:'elite',m:'鼎湖山',s:'yes'},
{n:'招雷飞猴头目',lv:70,atk:'180~260',def:160,ea:'-',ed:'火防60冰防60',bd:'偏大中',t:'elite',m:'雷公岩',s:'yes'},
/* 71-80级 冥府类 */
{n:'钢叉鬼卒',lv:71,atk:'120~180',def:300,ea:'-',ed:'三防60',bd:'小',t:'grunt',m:'巴蜀古墓、黄泉路、奈何桥',s:'yes'},
{n:'弓箭鬼卒',lv:72,atk:'160~200',def:200,ea:'-',ed:'三防60',bd:'小',t:'grunt',m:'巴蜀古墓、黄泉路',s:'yes'},
{n:'地狱树',lv:72,atk:'350~400',def:500,ea:'-',ed:'火防100冰防250毒防250',bd:'大',t:'grunt',m:'奈何桥',s:'yes'},
{n:'锤盾鬼卒',lv:73,atk:'130~180',def:400,ea:'-',ed:'三防60',bd:'小',t:'grunt',m:'巴蜀古墓、黄泉路',s:'yes'},
{n:'地府幽灵兽',lv:73,atk:'120~190',def:260,ea:'-',ed:'三防60',bd:'中',t:'grunt',m:'巴蜀古墓',s:'yes'},
{n:'灯笼冥府小厮',lv:73,atk:'50~90',def:700,ea:'火攻100',ed:'三防10',bd:'小',t:'grunt',m:'巴蜀古墓、黄泉路',s:'yes'},
{n:'灯笼铁链鬼',lv:74,atk:'140~180',def:300,ea:'-',ed:'三防60',bd:'中',t:'grunt',m:'巴蜀古墓、黄泉路',s:'yes'},
{n:'长枪冥府小厮',lv:74,atk:'50~100',def:700,ea:'火攻70~160',ed:'三防10',bd:'小',t:'grunt',m:'巴蜀古墓、黄泉路',s:'yes'},
{n:'铁钩铁链鬼',lv:75,atk:'145~185',def:300,ea:'-',ed:'三防60',bd:'中',t:'grunt',m:'巴蜀古墓',s:'yes'},
{n:'大棒冥府小厮',lv:75,atk:'70~160',def:700,ea:'火攻100',ed:'三防10',bd:'小',t:'grunt',m:'巴蜀古墓',s:'yes'},
{n:'大棒铁链鬼',lv:76,atk:'145~195',def:300,ea:'火攻90~150',ed:'三防60',bd:'中',t:'grunt',m:'巴蜀古墓',s:'yes'},
{n:'刀盾冥府小厮',lv:76,atk:'80~200',def:700,ea:'火攻100',ed:'三防10',bd:'小',t:'grunt',m:'巴蜀古墓',s:'yes'},
{n:'钢叉罗刹',lv:77,atk:'160~260',def:400,ea:'-',ed:'三防60',bd:'大',t:'grunt',m:'黑翼山、望乡台、云梦泽',s:'yes'},
{n:'锤盾罗刹',lv:78,atk:'180~260',def:400,ea:'火攻90~150',ed:'三防60',bd:'大',t:'grunt',m:'黑翼山、望乡台',s:'yes'},
{n:'牛首阿旁',lv:77,atk:'160~200',def:800,ea:'火攻300',ed:'-',bd:'大',t:'elite',m:'黑翼山、望乡台',s:'yes'},
{n:'马面阿旁',lv:77,atk:'300',def:200,ea:'毒攻100~200',ed:'三防200',bd:'大',t:'elite',m:'黑翼山、望乡台',s:'yes'},
{n:'暗翼蝙蝠',lv:77,atk:'150~205',def:400,ea:'-',ed:'三防60',bd:'小',t:'grunt',m:'黑翼山',s:'yes'},
{n:'冥府狼枪兵',lv:77,atk:'160~195',def:400,ea:'-',ed:'三防60',bd:'中',t:'grunt',m:'望乡台',s:'yes'},
{n:'冥府亡魂',lv:78,atk:'160~200',def:400,ea:'-',ed:'三防60',bd:'中',t:'grunt',m:'望乡台',s:'yes'},
{n:'冥府刀盾兵',lv:78,atk:'170~190',def:400,ea:'-',ed:'三防60',bd:'中',t:'grunt',m:'望乡台',s:'yes'},
{n:'短翼狐蝠',lv:79,atk:'190~210',def:400,ea:'-',ed:'三防60',bd:'小',t:'grunt',m:'黑翼山',s:'yes'},
{n:'冥府弓箭兵',lv:79,atk:'130~195',def:400,ea:'-',ed:'三防60',bd:'中',t:'grunt',m:'望乡台',s:'yes'},
/* Boss级 */
{n:'人厨子',lv:14,atk:'34~60',def:61,ea:'-',ed:'-',bd:'大',t:'boss',m:'十二陵上下',s:'yes'},
{n:'狼兵首领',lv:25,atk:'45~80',def:55,ea:'-',ed:'-',bd:'大',t:'boss',m:'狼王洞',s:'yes'},
{n:'熊王',lv:35,atk:'150~300',def:150,ea:'-',ed:'-',bd:'超大',t:'boss',m:'灵山寺',s:'yes'},
{n:'豹先锋',lv:40,atk:'75~150',def:120,ea:'-',ed:'-',bd:'大',t:'boss',m:'豹王帅帐',s:'yes'},
{n:'僵尸大王',lv:55,atk:'?',def:'?',ea:'?',ed:'?',bd:'超大',t:'boss',m:'桓王墓室',s:'yes'},
{n:'狐妖王',lv:60,atk:'?',def:'?',ea:'?',ed:'?',bd:'中',t:'boss',m:'狐妖部落',s:'yes'},
{n:'冰羌王',lv:60,atk:'?',def:'?',ea:'?',ed:'?',bd:'超大',t:'boss',m:'十八盘凌绝顶',s:'yes'},
{n:'嗜火老妖',lv:70,atk:'100~200',def:160,ea:'火攻600~800',ed:'火防80毒防80',bd:'大',t:'boss',m:'逐焰岛',s:'yes'},
{n:'滕玉魂魄',lv:70,atk:'200~380',def:150,ea:'火攻280~420冰攻280~420',ed:'冰防80毒防80',bd:'中',t:'boss',m:'滕玉墓下层',s:'yes'},
{n:'草头大圣',lv:70,atk:'400~600',def:180,ea:'-',ed:'三防60',bd:'巨大',t:'boss',m:'大圣庙',s:'yes'},
{n:'飞猴王',lv:70,atk:'380~460',def:160,ea:'-',ed:'火防60冰防60',bd:'大',t:'boss',m:'雷公岩',s:'yes'},
{n:'红面鬼',lv:74,atk:'300',def:700,ea:'火攻300',ed:'三防60',bd:'大',t:'boss',m:'孟婆寨',s:'yes'},
{n:'鬼王',lv:77,atk:'300~400',def:700,ea:'毒攻200',ed:'三防160',bd:'超大',t:'boss',m:'幽冥渡',s:'yes'},
{n:'千年蝠王',lv:80,atk:'300~380',def:900,ea:'火攻350~420冰攻320~450',ed:'三防100',bd:'巨大',t:'boss',m:'幽冥渡',s:'yes'},
/* 无资料怪物 85+级（按名判断，属性推算） */
{n:'巨型毒蜂',lv:82,atk:'656~984',def:328,ea:'毒攻200~300',ed:'毒防40',bd:'小',t:'grunt',m:'黔中古墟、桃源浣溪',s:'no'},
{n:'双斧青牛妖',lv:83,atk:'664~996',def:332,ea:'-',ed:'-',bd:'大',t:'grunt',m:'黔中古墟、桃源浣溪',s:'no'},
{n:'桃树精',lv:83,atk:'664~996',def:332,ea:'木攻200~300',ed:'-',bd:'中',t:'grunt',m:'桃源浣溪',s:'no'},
{n:'蜂妖',lv:83,atk:'664~996',def:332,ea:'毒攻200~300',ed:'毒防40',bd:'小',t:'grunt',m:'黔中古墟、桃源浣溪',s:'no'},
{n:'嗜血红魔',lv:84,atk:'1008~1512',def:504,ea:'血攻300~500',ed:'三防80',bd:'大',t:'elite',m:'黔中古墟',s:'no'},
{n:'象怪首领',lv:86,atk:'1032~1548',def:516,ea:'-',ed:'-',bd:'超大',t:'elite',m:'黔中古墟',s:'no'},
{n:'炎血蛤蟆',lv:85,atk:'680~1020',def:340,ea:'火攻300~500',ed:'火防80',bd:'小',t:'grunt',m:'炎魔废墟',s:'no'},
{n:'炎血鳄鱼',lv:85,atk:'680~1020',def:340,ea:'-',ed:'冰防60',bd:'中',t:'grunt',m:'炎魔废墟',s:'no'},
{n:'烈焰淤泥怪',lv:85,atk:'680~1020',def:340,ea:'火攻300~500',ed:'火防100',bd:'中',t:'grunt',m:'炎魔废墟',s:'no'},
{n:'蜂妖头领',lv:85,atk:'1020~1530',def:510,ea:'毒攻300~450',ed:'毒防60',bd:'小',t:'elite',m:'桃源浣溪',s:'no'},
{n:'大锤火焰守卫',lv:89,atk:'712~1068',def:356,ea:'火攻400~600',ed:'火防100',bd:'大',t:'grunt',m:'焚天谷',s:'no'},
{n:'大刀火焰守卫',lv:89,atk:'712~1068',def:356,ea:'火攻400~600',ed:'火防100',bd:'大',t:'grunt',m:'焚天谷',s:'no'},
{n:'火焰守卫',lv:89,atk:'712~1068',def:356,ea:'火攻350~500',ed:'火防80',bd:'中',t:'grunt',m:'焚天谷',s:'no'},
{n:'血钳虾精',lv:90,atk:'720~1080',def:360,ea:'水攻300~500',ed:'冰防60',bd:'小',t:'grunt',m:'水涌谷',s:'no'},
{n:'蓝螯蟹妖',lv:90,atk:'720~1080',def:360,ea:'-',ed:'冰防80',bd:'中',t:'grunt',m:'水涌谷',s:'no'},
{n:'碧鳞鱼怪',lv:90,atk:'720~1080',def:360,ea:'水攻300~500',ed:'-',bd:'中',t:'grunt',m:'水涌谷',s:'no'},
{n:'绣须虾精',lv:90,atk:'720~1080',def:360,ea:'水攻300~500',ed:'冰防60',bd:'小',t:'grunt',m:'月离峡',s:'no'},
{n:'紫壳蟹妖',lv:90,atk:'720~1080',def:360,ea:'-',ed:'冰防80',bd:'中',t:'grunt',m:'月离峡',s:'no'},
{n:'苍蓝鱼怪',lv:90,atk:'720~1080',def:360,ea:'水攻300~500',ed:'-',bd:'中',t:'grunt',m:'月离峡',s:'no'},
{n:'长枪虎兵',lv:90,atk:'720~1080',def:360,ea:'-',ed:'-',bd:'中',t:'grunt',m:'虎踞关',s:'no'},
{n:'短矛虎兵',lv:90,atk:'720~1080',def:360,ea:'-',ed:'-',bd:'中',t:'grunt',m:'虎踞关',s:'no'},
{n:'刀盾虎兵',lv:90,atk:'720~1080',def:360,ea:'-',ed:'-',bd:'大',t:'grunt',m:'虎踞关',s:'no'},
{n:'长枪虎妖',lv:92,atk:'736~1104',def:368,ea:'妖攻300~500',ed:'-',bd:'中',t:'grunt',m:'虎踞关',s:'no'},
{n:'短矛虎妖',lv:92,atk:'736~1104',def:368,ea:'妖攻300~500',ed:'-',bd:'中',t:'grunt',m:'虎踞关',s:'no'},
{n:'刀盾虎妖',lv:92,atk:'736~1104',def:368,ea:'妖攻300~500',ed:'-',bd:'大',t:'grunt',m:'虎踞关',s:'no'},
{n:'穿山甲苦力',lv:75,atk:'600~900',def:300,ea:'-',ed:'-',bd:'偏大中',t:'grunt',m:'东海',s:'no'},
{n:'穿山甲监工',lv:75,atk:'900~1350',def:450,ea:'-',ed:'-',bd:'偏大中',t:'elite',m:'东海、崂山',s:'no'},
{n:'高级穿山甲',lv:80,atk:'640~960',def:320,ea:'-',ed:'-',bd:'偏大中',t:'grunt',m:'崂山',s:'no'},
{n:'贪心魂魄',lv:75,atk:'450~675',def:225,ea:'-',ed:'-',bd:'中',t:'ghost',m:'崂山',s:'no'},
{n:'民兵亡魂',lv:75,atk:'450~675',def:225,ea:'-',ed:'-',bd:'中',t:'ghost',m:'东海',s:'no'},
{n:'虎王卫队',lv:65,atk:'780~1170',def:390,ea:'-',ed:'-',bd:'大',t:'elite',m:'落星湾',s:'no'},
{n:'古王傀儡',lv:48,atk:'960~1440',def:480,ea:'-',ed:'-',bd:'超大',t:'boss',m:'古王墓室',s:'no'},
{n:'剑祖残念',lv:99,atk:'1980~2970',def:990,ea:'洪荒攻800~1500',ed:'三防200',bd:'巨大',t:'boss',m:'洪荒古墟',s:'no'},
{n:'天兵',lv:108,atk:'864~1296',def:432,ea:'仙攻400~600',ed:'三防100',bd:'中',t:'grunt',m:'凌霄仙阶',s:'no'},
{n:'仙将',lv:108,atk:'1296~1944',def:648,ea:'仙攻600~900',ed:'三防150',bd:'大',t:'elite',m:'凌霄仙阶',s:'no'},
{n:'魔族余孽',lv:108,atk:'864~1296',def:432,ea:'魔攻400~600',ed:'三防100',bd:'中',t:'grunt',m:'凌霄仙阶',s:'no'},
/* 魂魄类（按名判断，原怪弱化版） */
{n:'刀盾狼兵魂魄',lv:15,atk:'5~11',def:9,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'锤盾狼精魂魄',lv:15,atk:'8~17',def:19,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'刀盾狼精魂魄',lv:15,atk:'7~15',def:14,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'锤盾狼兵魂魄',lv:15,atk:'7~13',def:13,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'铁弓狼精魂魄',lv:15,atk:'4~20',def:13,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'铁弓狼兵魂魄',lv:15,atk:'3~14',def:7,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'长枪狼精魂魄',lv:15,atk:'10~21',def:20,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'长枪狼兵魂魄',lv:15,atk:'5~11',def:9,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'飞刀猫妖魂魄',lv:15,atk:'8~32',def:33,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'飞刀猫兵魂魄',lv:15,atk:'6~29',def:28,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'铁爪猫妖魂魄',lv:15,atk:'15~30',def:36,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'铁爪猫兵魂魄',lv:15,atk:'13~25',def:29,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'长枪猫妖魂魄',lv:15,atk:'13~31',def:29,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'长枪猫兵魂魄',lv:15,atk:'11~27',def:25,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'傀儡魂魄',lv:15,atk:'18~35',def:24,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'},
{n:'野狗魂魄',lv:15,atk:'2~3',def:1,ea:'-',ed:'-',bd:'中',t:'ghost',m:'邪月台、鬼星台、魔星台、妖星台',s:'no'}
];
/* 渲染逻辑 */
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var gold = style.getPropertyValue('--gold').trim();

  var TYPE_LABEL = { grunt: '小兵', elite: '精英', boss: 'Boss', ghost: '魂魄' };
  var SRC_LABEL = { yes: '有资料', no: '按名判断' };

  var tbody = document.getElementById('monster-body');
  var countEl = document.getElementById('count');
  var searchEl = document.getElementById('search');
  var typeEl = document.getElementById('filter-type');
  var srcEl = document.getElementById('filter-src');
  var sortAsc = true;
  var sortKey = 'lv';

  function pill(t) {
    return '<span class="pill ' + t + '">' + TYPE_LABEL[t] + '</span>';
  }
  function srcPill(s) {
    return '<span class="pill src-' + s + '">' + SRC_LABEL[s] + '</span>';
  }
  function calcHp(m) {
    if (m.hp) return m.hp;
    var base = m.lv * 50;
    if (m.t === 'elite') base = m.lv * 120;
    if (m.t === 'boss') base = m.lv * 500;
    if (m.t === 'ghost') base = m.lv * 30;
    return base;
  }

  function render() {
    var q = searchEl.value.trim().toLowerCase();
    var ft = typeEl.value;
    var fs = srcEl.value;
    var rows = MONSTERS.filter(function (m) {
      if (ft && m.t !== ft) return false;
      if (fs && m.s !== fs) return false;
      if (q && (m.n.toLowerCase().indexOf(q) < 0 && m.m.toLowerCase().indexOf(q) < 0)) return false;
      return true;
    });
    rows.sort(function (a, b) {
      var va = sortKey === 'hp' ? calcHp(a) : a.lv;
      var vb = sortKey === 'hp' ? calcHp(b) : b.lv;
      return sortAsc ? va - vb : vb - va;
    });
    var html = rows.map(function (m) {
      return '<tr><td class="name">' + m.n + '</td><td class="stat">' + m.lv + '</td><td class="stat hp">' + calcHp(m) + '</td><td class="stat">' + m.atk + '</td><td class="stat">' + m.def + '</td><td class="stat">' + m.ea + '</td><td class="stat">' + m.ed + '</td><td class="stat">' + m.bd + '</td><td>' + pill(m.t) + '</td><td class="map">' + m.m + '</td><td>' + srcPill(m.s) + '</td></tr>';
    }).join('');
    tbody.innerHTML = html;
    countEl.textContent = '共 ' + rows.length + ' 条 / 总 ' + MONSTERS.length + ' 条';
  }

  searchEl.addEventListener('input', render);
  typeEl.addEventListener('change', render);
  srcEl.addEventListener('change', render);
  document.querySelectorAll('th').forEach(function (th, i) {
    if (i === 1 || i === 2) th.addEventListener('click', function () {
      var key = (i === 1) ? 'lv' : 'hp';
      if (sortKey === key) { sortAsc = !sortAsc; } else { sortKey = key; sortAsc = true; }
      render();
    });
  });
  render();

  /* 图2-1 类型分布饼图 */
  var typeCount = {};
  MONSTERS.forEach(function (m) { typeCount[m.t] = (typeCount[m.t] || 0) + 1; });
  var c1 = echarts.init(document.getElementById('chart-type'), null, { renderer: 'svg' });
  c1.setOption({
    animation: false,
    tooltip: { appendToBody: true, trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: muted } },
    series: [{
      type: 'pie', radius: ['38%', '62%'], center: ['50%', '42%'],
      label: { color: ink, formatter: '{b}\n{c}种' },
      data: Object.keys(typeCount).map(function (k) { return { name: TYPE_LABEL[k], value: typeCount[k] }; }),
      color: [accent, accent2, gold, muted]
    }]
  });

  /* 图2-2 等级区间分布柱图 */
  var buckets = {};
  MONSTERS.forEach(function (m) {
    var b = Math.floor(m.lv / 10) * 10;
    if (b >= 100) b = 100;
    var key = b + '-' + (b + 9);
    if (b === 100) key = '108+';
    buckets[key] = (buckets[key] || 0) + 1;
  });
  var xData = Object.keys(buckets);
  var yData = xData.map(function (k) { return buckets[k]; });
  var c2 = echarts.init(document.getElementById('chart-level'), null, { renderer: 'svg' });
  c2.setOption({
    animation: false,
    tooltip: { appendToBody: true },
    grid: { left: 48, right: 24, top: 24, bottom: 48 },
    xAxis: { type: 'category', data: xData, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, rotate: 30 } },
    yAxis: { type: 'value', name: '怪物数', nameTextStyle: { color: muted }, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
    series: [{ type: 'bar', data: yData, itemStyle: { color: accent }, label: { show: true, color: ink, position: 'top' } }]
  });

  window.addEventListener('resize', function () { c1.resize(); c2.resize(); });
})();

