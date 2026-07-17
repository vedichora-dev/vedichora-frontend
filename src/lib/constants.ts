// ── RASI DATA (from original VedicHora HTML) ──
export const RASI = [
  { ic:'aries',       vd:'Mesha',     ta:'Medam',      en:'Aries',       sc:{Daily:78,Weekly:72,Monthly:69,Yearly:74}, lucky:['Coral red','9','Coral'],    element:'Fire',  lord:'Mars',    dates:'Mar 21–Apr 19' },
  { ic:'taurus',      vd:'Vrishabha', ta:'Rishabham',  en:'Taurus',      sc:{Daily:65,Weekly:70,Monthly:68,Yearly:72}, lucky:['White','6','Diamond'],      element:'Earth', lord:'Venus',   dates:'Apr 20–May 20' },
  { ic:'gemini',      vd:'Mithuna',   ta:'Mithunam',   en:'Gemini',      sc:{Daily:82,Weekly:76,Monthly:80,Yearly:71}, lucky:['Green','5','Emerald'],      element:'Air',   lord:'Mercury', dates:'May 21–Jun 20' },
  { ic:'cancer',      vd:'Karka',     ta:'Karkatakam', en:'Cancer',      sc:{Daily:70,Weekly:66,Monthly:64,Yearly:68}, lucky:['Pearl white','2','Pearl'],   element:'Water', lord:'Moon',    dates:'Jun 21–Jul 22' },
  { ic:'leo',         vd:'Simha',     ta:'Chingam',    en:'Leo',         sc:{Daily:88,Weekly:84,Monthly:82,Yearly:80}, lucky:['Gold','1','Ruby'],           element:'Fire',  lord:'Sun',     dates:'Jul 23–Aug 22' },
  { ic:'virgo',       vd:'Kanya',     ta:'Kanni',      en:'Virgo',       sc:{Daily:74,Weekly:78,Monthly:72,Yearly:76}, lucky:['Dark green','5','Emerald'],  element:'Earth', lord:'Mercury', dates:'Aug 23–Sep 22' },
  { ic:'libra',       vd:'Tula',      ta:'Tulam',      en:'Libra',       sc:{Daily:61,Weekly:65,Monthly:68,Yearly:70}, lucky:['Silver','6','Diamond'],      element:'Air',   lord:'Venus',   dates:'Sep 23–Oct 22' },
  { ic:'scorpio',     vd:'Vrishchika',ta:'Vrischikam', en:'Scorpio',     sc:{Daily:77,Weekly:72,Monthly:75,Yearly:73}, lucky:['Dark red','9','Coral'],      element:'Water', lord:'Mars',    dates:'Oct 23–Nov 21' },
  { ic:'sagittarius', vd:'Dhanu',     ta:'Dhanu',      en:'Sagittarius', sc:{Daily:83,Weekly:86,Monthly:80,Yearly:82}, lucky:['Yellow','3','Yellow sapph'], element:'Fire',  lord:'Jupiter', dates:'Nov 22–Dec 21' },
  { ic:'capricorn',   vd:'Makara',    ta:'Makaram',    en:'Capricorn',   sc:{Daily:69,Weekly:67,Monthly:71,Yearly:74}, lucky:['Black','8','Blue sapph'],    element:'Earth', lord:'Saturn',  dates:'Dec 22–Jan 19' },
  { ic:'aquarius',    vd:'Kumbha',    ta:'Kumbham',    en:'Aquarius',    sc:{Daily:72,Weekly:75,Monthly:70,Yearly:69}, lucky:['Blue','8','Blue sapph'],     element:'Air',   lord:'Saturn',  dates:'Jan 20–Feb 18' },
  { ic:'pisces',      vd:'Meena',     ta:'Meenam',     en:'Pisces',      sc:{Daily:67,Weekly:64,Monthly:66,Yearly:72}, lucky:['Sea green','3','Yellow sapph'],element:'Water',lord:'Jupiter', dates:'Feb 19–Mar 20' },
]

export const AUTH_URL  = 'https://vedichora-platform-production.up.railway.app'
export const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export const CURRENCIES = [
  { code:'INR', sym:'₹',   flag:'🇮🇳', name:'Indian Rupee'      },
  { code:'USD', sym:'$',   flag:'🇺🇸', name:'US Dollar'          },
  { code:'GBP', sym:'£',   flag:'🇬🇧', name:'British Pound'      },
  { code:'SGD', sym:'S$',  flag:'🇸🇬', name:'Singapore Dollar'   },
  { code:'MYR', sym:'RM',  flag:'🇲🇾', name:'Malaysian Ringgit'  },
  { code:'AED', sym:'AED', flag:'🇦🇪', name:'UAE Dirham'         },
  { code:'AUD', sym:'A$',  flag:'🇦🇺', name:'Australian Dollar'  },
  { code:'CAD', sym:'C$',  flag:'🇨🇦', name:'Canadian Dollar'    },
  { code:'LKR', sym:'Rs',  flag:'🇱🇰', name:'Sri Lankan Rupee'   },
]

export const LANGUAGES = [
  { code:'en',    flag:'🇮🇳', label:'English'   },
  { code:'ta',    flag:'🇮🇳', label:'தமிழ்'     },
  { code:'hi',    flag:'🇮🇳', label:'हिन्दी'    },
  { code:'te',    flag:'🇮🇳', label:'Telugu'    },
  { code:'ml',    flag:'🇮🇳', label:'Malayalam' },
  { code:'kn',    flag:'🇮🇳', label:'ಕನ್ನಡ'     },
  { code:'en-GB', flag:'🇬🇧', label:'English UK' },
  { code:'en-SG', flag:'🇸🇬', label:'Singapore'  },
  { code:'en-MY', flag:'🇲🇾', label:'Malaysia'   },
  { code:'en-AE', flag:'🇦🇪', label:'UAE'        },
]

export const THEMES = [
  { key:'lotus',      label:'Lotus',      swatch:'linear-gradient(135deg,#FAE8EE,#C4527A)' },
  { key:'ivory',      label:'Ivory',      swatch:'linear-gradient(135deg,#FBF6EC,#E3D6BC)' },
  { key:'manuscript', label:'Manuscript', swatch:'linear-gradient(135deg,#E2D2AC,#9C854C)' },
  { key:'eclipse',    label:'Eclipse',    swatch:'linear-gradient(135deg,#221A12,#0A0604)'  },
  { key:'pearl',      label:'Pearl',      swatch:'linear-gradient(135deg,#ffffff,#C0C0CC)'  },
  { key:'crimson',    label:'Crimson',    swatch:'linear-gradient(135deg,#6B2C2C,#3A1414)'  },
  { key:'teal',       label:'Teal',       swatch:'linear-gradient(135deg,#0F2A2A,#2A8870)'  },
  { key:'noir',       label:'Noir',       swatch:'linear-gradient(135deg,#111008,#A07820)'  },
  { key:'bronze',     label:'Bronze',     swatch:'linear-gradient(135deg,#1C1A0A,#A09020)'  },
  { key:'lavender',   label:'Lavender',   swatch:'linear-gradient(135deg,#EEE8F8,#7A52B8)'  },
  { key:'lotus',      label:'Lotus',      swatch:'linear-gradient(135deg,#FAE8EE,#C4527A)'  },
  { key:'steel',      label:'Steel',      swatch:'linear-gradient(135deg,#D8EAF5,#2A6A9A)'  },
  { key:'sage',       label:'Sage',       swatch:'linear-gradient(135deg,#E6F0E8,#4A8A5A)'  },
]

export const SAMPLE_ASTROLOGERS = [
  { userId:1, displayName:'Pandit Rajesh Sharma', specialties:['Vedic','KP','Prashna'], ratePerMinute:35, averageRating:4.97, totalSessions:3412, isOnline:true  },
  { userId:2, displayName:'Meera Devi',            specialties:['Parashara','Remedies'], ratePerMinute:28, averageRating:4.92, totalSessions:2187, isOnline:true  },
  { userId:3, displayName:'Dr. K. Subramaniam',    specialties:['Jyotish','Muhurta'],    ratePerMinute:55, averageRating:4.95, totalSessions:5621, isOnline:false },
  { userId:4, displayName:'Priya Nair',            specialties:['Numerology','Tarot'],   ratePerMinute:22, averageRating:4.88, totalSessions:1834, isOnline:true  },
  { userId:5, displayName:'Guru Vishwanath',       specialties:['Nadi','Prasna'],         ratePerMinute:45, averageRating:4.99, totalSessions:7203, isOnline:true  },
  { userId:6, displayName:'Ananya Krishnan',       specialties:['Vedic','Vastu'],         ratePerMinute:30, averageRating:4.91, totalSessions:2945, isOnline:false },
]
