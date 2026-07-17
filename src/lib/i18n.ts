'use client'
import { useStore } from '@/store'
import en from '@/i18n/en.json'
import ta from '@/i18n/ta.json'
import hi from '@/i18n/hi.json'

const STATIC: Record<string, Record<string,Record<string,string>>> = { en, ta, hi }

// Planet names per language — used in Vedic layout only
const PLANET_NAMES: Record<string, string[]> = {
  en: ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'],
  ta: ['சூரியன்','சந்திரன்','செவ்வாய்','புதன்','குரு','சுக்கிரன்','சனி','ராகு','கேது'],
  hi: ['सूर्य','चंद्र','मंगल','बुध','गुरु','शुक्र','शनि','राहु','केतु'],
  te: ['సూర్యుడు','చంద్రుడు','అంగారకుడు','బుధుడు','గురుడు','శుక్రుడు','శని','రాహువు','కేతువు'],
  ml: ['സൂര്യൻ','ചന്ദ്രൻ','ചൊവ്വ','ബുധൻ','വ്യാഴം','ശുക്രൻ','ശനി','രാഹു','കേതു'],
  kn: ['ಸೂರ್ಯ','ಚಂದ್ರ','ಮಂಗಳ','ಬುಧ','ಗುರು','ಶುಕ್ರ','ಶನಿ','ರಾಹು','ಕೇತು'],
  sa: ['सूर्यः','चन्द्रः','मङ्गलः','बुधः','बृहस्पतिः','शुक्रः','शनिः','राहुः','केतुः'],
  fr: ['Soleil','Lune','Mars','Mercure','Jupiter','Vénus','Saturne','Rahu','Ketu'],
  de: ['Sonne','Mond','Mars','Merkur','Jupiter','Venus','Saturn','Rahu','Ketu'],
  es: ['Sol','Luna','Marte','Mercurio','Júpiter','Venus','Saturno','Rahu','Ketu'],
  ar: ['الشمس','القمر','المريخ','عطارد','المشتري','الزهرة','زحل','راهو','كيتو'],
  'zh-Hans': ['太阳','月亮','火星','水星','木星','金星','土星','罗睺','计都'],
  ja: ['太陽','月','火星','水星','木星','金星','土星','ラーフ','ケートゥ'],
  ko: ['태양','달','화성','수성','목성','금성','토성','라후','케투'],
}

// Vedic rasi names (Indian) per language
const RASI_NAMES: Record<string, string[]> = {
  en: ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'],
  ta: ['மேஷம்','ரிஷபம்','மிதுனம்','கர்கடகம்','சிம்மம்','கன்னி','துலாம்','விருச்சிகம்','தனுசு','மகரம்','கும்பம்','மீனம்'],
  hi: ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'],
  te: ['మేషం','వృషభం','మిథున','కర్కాటకం','సింహం','కన్య','తుల','వృశ్చికం','ధనుస్సు','మకరం','కుంభం','మీనం'],
  ml: ['മേടം','ഇടവം','മിഥുനം','കർക്കടകം','ചിങ്ങം','കന്നി','തുലാം','വൃശ്ചികം','ധനു','മകരം','കുംഭം','മീനം'],
  kn: ['ಮೇಷ','ವೃಷಭ','ಮಿಥುನ','ಕರ್ಕಾಟಕ','ಸಿಂಹ','ಕನ್ಯಾ','ತುಲಾ','ವೃಶ್ಚಿಕ','ಧನು','ಮಕರ','ಕುಂಭ','ಮೀನ'],
  sa: ['मेषः','वृषभः','मिथुनः','कर्कटः','सिंहः','कन्याः','तुलाः','वृश्चिकः','धनुः','मकरः','कुम्भः','मीनः'],
  fr: ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'],
  de: ['Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau','Waage','Skorpion','Schütze','Steinbock','Wassermann','Fische'],
  es: ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'],
  ar: ['الحمل','الثور','الجوزاء','السرطان','الأسد','العذراء','الميزان','العقرب','القوس','الجدي','الدلو','الحوت'],
  'zh-Hans': ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'],
  ja: ['牡羊座','牡牛座','双子座','蟹座','獅子座','乙女座','天秤座','蠍座','射手座','山羊座','水瓶座','魚座'],
  ko: ['양자리','황소자리','쌍둥이자리','게자리','사자자리','처녀자리','천칭자리','전갈자리','사수자리','염소자리','물병자리','물고기자리'],
}

// Western sign names — always English symbols
export const WESTERN_SIGNS = ['♈ Aries','♉ Taurus','♊ Gemini','♋ Cancer','♌ Leo','♍ Virgo','♎ Libra','♏ Scorpio','♐ Sagittarius','♑ Capricorn','♒ Aquarius','♓ Pisces']

export function useT() {
  const { language } = useStore()
  const dict = STATIC[language] || STATIC.en
  return function t(key: string, fallback?: string): string {
    const parts = key.split('.')
    let val: unknown = dict
    for (const p of parts) {
      if (val && typeof val === 'object' && p in (val as object))
        val = (val as Record<string, unknown>)[p]
      else {
        let enVal: unknown = en
        for (const ep of parts) {
          if (enVal && typeof enVal === 'object' && ep in (enVal as object))
            enVal = (enVal as Record<string, unknown>)[ep]
          else { enVal = fallback || key; break }
        }
        return String(enVal || fallback || key)
      }
    }
    return String(val || fallback || key)
  }
}

// Planet name in current language
export function usePlanetName() {
  const { language } = useStore()
  const names = PLANET_NAMES[language] || PLANET_NAMES.en
  const ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
  return (planet: string): string => {
    const idx = ORDER.indexOf(planet)
    return idx >= 0 ? names[idx] : planet
  }
}

// Rasi name in current language (Vedic Indian names)
export function useSignName() {
  const { language } = useStore()
  const names = RASI_NAMES[language] || RASI_NAMES.en
  const VEDIC = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena']
  return (sign: string): string => {
    const idx = VEDIC.indexOf(sign)
    if (idx >= 0) return names[idx]
    const numIdx = parseInt(sign)
    if (!isNaN(numIdx) && names[numIdx]) return names[numIdx]
    return sign
  }
}
