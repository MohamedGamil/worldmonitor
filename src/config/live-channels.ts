import { LiveChannel } from '@/interfaces/LiveChannel';

/**
 * Full global variant: World news channels (24/7 live streams)
 */
export const FULL_LIVE_CHANNELS_GLOBAL: LiveChannel[] = [
  { id: 'bloomberg', name: 'Bloomberg', handle: '@markets', fallbackVideoId: 'iEpJwprxDdk' },
  { id: 'sky', name: 'SkyNews', handle: '@SkyNews', fallbackVideoId: 'uvviIF4725I' },
  { id: 'euronews', name: 'Euronews', handle: '@euronews', fallbackVideoId: 'pykpO5kQJ98' },
  { id: 'dw', name: 'DW', handle: '@DWNews', fallbackVideoId: 'LuKwFajn37U' },
  { id: 'cnbc', name: 'CNBC', handle: '@CNBC', fallbackVideoId: '9NyxcX3rhQs' },
  { id: 'cnn', name: 'CNN', handle: '@CNN', fallbackVideoId: 'w_Ma8oQLmSM' },
  { id: 'france24', name: 'France 24', handle: '@FRANCE24', fallbackVideoId: 'u9foWyMSETk' },
  { id: 'alarabiya', name: 'AlArabiya', handle: '@AlArabiya', fallbackVideoId: 'n7eQejkXbnM', useFallbackOnly: true },
  { id: 'aljazeera', name: 'AlJazeera', handle: '@AlJazeeraEnglish', fallbackVideoId: 'gCNeDWCI0vo', useFallbackOnly: true },
];

/**
 * Tech global variant: Tech & business channels
 */
export const TECH_LIVE_CHANNELS_GLOBAL: LiveChannel[] = [
  { id: 'bloomberg', name: 'Bloomberg', handle: '@markets', fallbackVideoId: 'iEpJwprxDdk' },
  { id: 'yahoo', name: 'Yahoo Finance', handle: '@YahooFinance', fallbackVideoId: 'KQp-e_XQnDE' },
  { id: 'cnbc', name: 'CNBC', handle: '@CNBC', fallbackVideoId: '9NyxcX3rhQs' },
  { id: 'nasa', name: 'Sen Space Live', handle: '@NASA', fallbackVideoId: 'aB1yRz0HhdY', useFallbackOnly: true },
];

/**
 * All optional channels
 */
export const LIVE_CHANNELS_LIST: LiveChannel[] = [
  // North America (defaults first)
  { id: 'bloomberg', name: 'Bloomberg', handle: '@markets', fallbackVideoId: 'iEpJwprxDdk' },
  { id: 'cnbc', name: 'CNBC', handle: '@CNBC', fallbackVideoId: '9NyxcX3rhQs' },
  { id: 'yahoo', name: 'Yahoo Finance', handle: '@YahooFinance', fallbackVideoId: 'KQp-e_XQnDE' },
  { id: 'cnn', name: 'CNN', handle: '@CNN', fallbackVideoId: 'w_Ma8oQLmSM' },
  { id: 'fox-news', name: 'Fox News', handle: '@FoxNews', fallbackVideoId: 'QaftgYkG-ek' },
  { id: 'newsmax', name: 'Newsmax', handle: '@NEWSMAX', fallbackVideoId: 'S-lFBzloL2Y', useFallbackOnly: true },
  { id: 'abc-news', name: 'ABC News', handle: '@ABCNews' },
  { id: 'cbs-news', name: 'CBS News', handle: '@CBSNews', fallbackVideoId: 'R9L8sDK8iEc' },
  { id: 'nbc-news', name: 'NBC News', handle: '@NBCNews', fallbackVideoId: 'yMr0neQhu6c' },
  { id: 'cbc-news', name: 'CBC News', handle: '@CBCNews', fallbackVideoId: 'jxP_h3V-Dv8' },
  { id: 'nasa', name: 'Sen Space Live', handle: '@NASA', fallbackVideoId: 'aB1yRz0HhdY', useFallbackOnly: true },
  // Europe (defaults first)
  { id: 'sky', name: 'SkyNews', handle: '@SkyNews', fallbackVideoId: 'uvviIF4725I' },
  { id: 'euronews', name: 'Euronews', handle: '@euronews', fallbackVideoId: 'pykpO5kQJ98' },
  { id: 'dw', name: 'DW', handle: '@DWNews', fallbackVideoId: 'LuKwFajn37U' },
  { id: 'france24', name: 'France 24', handle: '@FRANCE24', fallbackVideoId: 'u9foWyMSETk' },
  { id: 'bbc-news', name: 'BBC News', handle: '@BBCNews', fallbackVideoId: 'bjgQzJzCZKs' },
  { id: 'france24-en', name: 'France 24 English', handle: '@France24_en', fallbackVideoId: 'Ap-UM1O9RBU' },
  { id: 'rtve', name: 'RTVE 24H', handle: '@RTVENoticias', fallbackVideoId: '7_srED6k0bE' },
  { id: 'trt-haber', name: 'TRT Haber', handle: '@trthaber', fallbackVideoId: '3XHebGJG0bc' },
  { id: 'ntv-turkey', name: 'NTV', handle: '@NTV', fallbackVideoId: 'pqq5c6k70kk' },
  { id: 'cnn-turk', name: 'CNN TURK', handle: '@cnnturk', fallbackVideoId: 'lsY4GFoj_xY' },
  { id: 'tv-rain', name: 'TV Rain', handle: '@tvrain' },
  { id: 'rt', name: 'RT', handle: '' },
  { id: 'tvp-info', name: 'TVP Info', handle: '@tvpinfo', fallbackVideoId: '3jKb-uThfrg' },
  { id: 'telewizja-republika', name: 'Telewizja Republika', handle: '@Telewizja_Republika', fallbackVideoId: 'dzntyCTgJMQ' },
  // Latin America & Portuguese
  { id: 'cnn-brasil', name: 'CNN Brasil', handle: '@CNNbrasil', fallbackVideoId: 'qcTn899skkc' },
  { id: 'jovem-pan', name: 'Jovem Pan News', handle: '@jovempannews' },
  { id: 'record-news', name: 'Record News', handle: '@RecordNews' },
  { id: 'band-jornalismo', name: 'Band Jornalismo', handle: '@BandJornalismo' },
  { id: 'tn-argentina', name: 'TN (Todo Noticias)', handle: '@todonoticias', fallbackVideoId: 'cb12KmMMDJA' },
  { id: 'c5n', name: 'C5N', handle: '@c5n', fallbackVideoId: 'SF06Qy1Ct6Y' },
  { id: 'milenio', name: 'MILENIO', handle: '@MILENIO' },
  { id: 'noticias-caracol', name: 'Noticias Caracol', handle: '@NoticiasCaracol' },
  { id: 'ntn24', name: 'NTN24', handle: '@NTN24' },
  { id: 't13', name: 'T13', handle: '@Teletrece' },
  // Asia
  { id: 'tbs-news', name: 'TBS NEWS DIG', handle: '@tbsnewsdig', fallbackVideoId: 'aUDm173E8k8' },
  { id: 'ann-news', name: 'ANN News', handle: '@ANNnewsCH' },
  { id: 'ntv-news', name: 'NTV News (Japan)', handle: '@ntv_news' },
  { id: 'cti-news', name: 'CTI News (Taiwan)', handle: '@中天新聞CtiNews' },
  { id: 'wion', name: 'WION', handle: '@WION' },
  { id: 'ndtv', name: 'NDTV 24x7', handle: '@NDTV' },
  { id: 'cna-asia', name: 'CNA (NewsAsia)', handle: '@channelnewsasia', fallbackVideoId: 'XWq5kBlakcQ' },
  { id: 'nhk-world', name: 'NHK World Japan', handle: '@NHKWORLDJAPAN', fallbackVideoId: 'f0lYfG_vY_U' },
  { id: 'arirang-news', name: 'Arirang News', handle: '@ArirangCoKrArirangNEWS' },
  { id: 'india-today', name: 'India Today', handle: '@indiatoday', fallbackVideoId: 'sYZtOFzM78M' },
  { id: 'abp-news', name: 'ABP News', handle: '@ABPNews' },
  // Middle East (defaults first)
  { id: 'alarabiya', name: 'AlArabiya', handle: '@AlArabiya', fallbackVideoId: 'n7eQejkXbnM', useFallbackOnly: true },
  { id: 'aljazeera', name: 'AlJazeera', handle: '@AlJazeeraEnglish', fallbackVideoId: 'gCNeDWCI0vo', useFallbackOnly: true },
  { id: 'al-hadath', name: 'Al Hadath', handle: '@AlHadath', fallbackVideoId: 'xWXpl7azI8k', useFallbackOnly: true },
  { id: 'sky-news-arabia', name: 'Sky News Arabia', handle: '@skynewsarabia', fallbackVideoId: 'U--OjmpjF5o' },
  { id: 'trt-world', name: 'TRT World', handle: '@TRTWorld', fallbackVideoId: 'ABfFhWzWs0s' },
  { id: 'iran-intl', name: 'Iran International', handle: '@IranIntl' },
  { id: 'cgtn-arabic', name: 'CGTN Arabic', handle: '@CGTNArabic' },
  { id: 'kan-11', name: 'Kan 11', handle: '@KAN11NEWS', fallbackVideoId: 'TCnaIE_SAtM' },
  { id: 'asharq-news', name: 'Asharq News', handle: '@asharqnews', fallbackVideoId: 'f6VpkfV7m4Y', useFallbackOnly: true },
  // Africa
  { id: 'africanews', name: 'Africanews', handle: '@africanews' },
  { id: 'channels-tv', name: 'Channels TV', handle: '@ChannelsTelevision' },
  { id: 'ktn-news', name: 'KTN News', handle: '@ktnnews_kenya', fallbackVideoId: 'RmHtsdVb3mo' },
  { id: 'enca', name: 'eNCA', handle: '@encanews' },
  { id: 'sabc-news', name: 'SABC News', handle: '@SABCDigitalNews' },
  { id: 'arise-news', name: 'Arise News', handle: '@AriseNewsChannel', fallbackVideoId: '4uHZdlX-DT4' },
  // Europe (additional)
  { id: 'welt', name: 'WELT', handle: '@WELTVideoTV', fallbackVideoId: 'L-TNmYmaAKQ', geoAvailability: ['DE', 'AT', 'CH'] },
  { id: 'tagesschau24', name: 'Tagesschau24', handle: '@tagesschau', fallbackVideoId: 'fC_q9TkO1uU' },
  { id: 'euronews-fr', name: 'Euronews FR', handle: '@euronewsfr', fallbackVideoId: 'NiRIbKwAejk' },
  { id: 'france24-fr', name: 'France 24 FR', handle: '@France24_fr', fallbackVideoId: 'l8PMl7tUDIE' },
  { id: 'france-info', name: 'France Info', handle: '@franceinfo', fallbackVideoId: 'Z-Nwo-ypKtM' },
  { id: 'bfmtv', name: 'BFMTV', handle: '@BFMTV', fallbackVideoId: 'smB_F6DW7cI' },
  { id: 'tv5monde-info', name: 'TV5 Monde Info', handle: '@TV5MONDEInfo' },
  { id: 'nrk1', name: 'NRK1', handle: '@nrk' },
  { id: 'aljazeera-balkans', name: 'Al Jazeera Balkans', handle: '@AlJazeeraBalkans' },
  // Oceania
  { id: 'abc-news-au', name: 'ABC News Australia', handle: '@abcnewsaustralia', fallbackVideoId: 'vOTiJkg1voo' },
];