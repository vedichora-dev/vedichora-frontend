export const AUTH_URL  = 'https://vedichora-platform-production.up.railway.app'
export const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export const RASI = [
  { ic:'aries',       vd:'Mesha',     ta:'Medam',      en:'Aries',       element:'Fire',  lord:'Mars',    dates:'Mar 21 – Apr 19', lucky:['Coral red','9','Coral']    },
  { ic:'taurus',      vd:'Vrishabha', ta:'Rishabham',  en:'Taurus',      element:'Earth', lord:'Venus',   dates:'Apr 20 – May 20', lucky:['White','6','Diamond']      },
  { ic:'gemini',      vd:'Mithuna',   ta:'Mithunam',   en:'Gemini',      element:'Air',   lord:'Mercury', dates:'May 21 – Jun 20', lucky:['Green','5','Emerald']      },
  { ic:'cancer',      vd:'Karka',     ta:'Karkatakam', en:'Cancer',      element:'Water', lord:'Moon',    dates:'Jun 21 – Jul 22', lucky:['Pearl white','2','Pearl']   },
  { ic:'leo',         vd:'Simha',     ta:'Chingam',    en:'Leo',         element:'Fire',  lord:'Sun',     dates:'Jul 23 – Aug 22', lucky:['Gold','1','Ruby']           },
  { ic:'virgo',       vd:'Kanya',     ta:'Kanni',      en:'Virgo',       element:'Earth', lord:'Mercury', dates:'Aug 23 – Sep 22', lucky:['Green','5','Emerald']      },
  { ic:'libra',       vd:'Thula',     ta:'Tulam',      en:'Libra',       element:'Air',   lord:'Venus',   dates:'Sep 23 – Oct 22', lucky:['Blue','6','Diamond']       },
  { ic:'scorpio',     vd:'Vrischika', ta:'Vrischikam', en:'Scorpio',     element:'Water', lord:'Mars',    dates:'Oct 23 – Nov 21', lucky:['Red','9','Coral']          },
  { ic:'sagittarius', vd:'Dhanu',     ta:'Dhanusu',    en:'Sagittarius', element:'Fire',  lord:'Jupiter', dates:'Nov 22 – Dec 21', lucky:['Yellow','3','Yellow Sapph']},
  { ic:'capricorn',   vd:'Makara',    ta:'Makaram',    en:'Capricorn',   element:'Earth', lord:'Saturn',  dates:'Dec 22 – Jan 19', lucky:['Black','8','Blue Sapph']   },
  { ic:'aquarius',    vd:'Kumbha',    ta:'Kumbham',    en:'Aquarius',    element:'Air',   lord:'Saturn',  dates:'Jan 20 – Feb 18', lucky:['Blue','8','Blue Sapph']    },
  { ic:'pisces',      vd:'Meena',     ta:'Meenam',     en:'Pisces',      element:'Water', lord:'Jupiter', dates:'Feb 19 – Mar 20', lucky:['Yellow','3','Yellow Sapph']},
]

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

export const SAMPLE_ASTROLOGERS = [
  { userId:1, displayName:'Pandit Rajesh Sharma', specialties:['Vedic','KP','Prashna'], ratePerMinute:35, averageRating:4.97, totalSessions:3412, isOnline:true  },
  { userId:2, displayName:'Meera Devi',            specialties:['Parashara','Remedies'], ratePerMinute:28, averageRating:4.92, totalSessions:2187, isOnline:true  },
  { userId:3, displayName:'Dr. K. Subramaniam',    specialties:['Jyotish','Muhurta'],    ratePerMinute:55, averageRating:4.95, totalSessions:5621, isOnline:false },
  { userId:4, displayName:'Priya Nair',            specialties:['Numerology','Tarot'],   ratePerMinute:22, averageRating:4.88, totalSessions:1834, isOnline:true  },
  { userId:5, displayName:'Guru Vishwanath',       specialties:['Nadi','Prasna'],         ratePerMinute:45, averageRating:4.99, totalSessions:7203, isOnline:true  },
  { userId:6, displayName:'Ananya Krishnan',       specialties:['Vedic','Vastu'],         ratePerMinute:30, averageRating:4.91, totalSessions:2945, isOnline:false },
]
