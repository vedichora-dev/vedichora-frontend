import { authApi, chartApi, guestApi, apiGet, apiPost } from './client'

// ── AUTH ──────────────────────────────────────────────────────
export const authLogin = (email: string, password: string) =>
  authApi.post('/api/auth/login', { email, password })

export const authRegister = (email: string, password: string, displayName: string) =>
  authApi.post('/api/auth/register', { email, password, displayName, userTypeId: 1 })

export const authProfile = () =>
  authApi.get('/api/auth/profile', {
    headers: { Authorization: `Bearer ${localStorage.getItem('vh_token')}` }
  })

// ── HOROSCOPE (public) ────────────────────────────────────────
export const getHoroscopeAll = (lang = 'en') =>
  apiGet<any[]>(`/api/horoscope/daily/all?lang=${lang}`)

export const getRasiHoroscope = (idx: number, lang = 'en') =>
  apiGet<any>(`/api/horoscope/rasi/${idx}/daily?lang=${lang}`)

// ── CHART ─────────────────────────────────────────────────────
export interface ChartRequest {
  PersonName?: string
  Year: number; Month: number; Day: number
  Hour: number; Minute: number; Second: number
  PlaceName?: string
  Latitude?: number
  Longitude?: number
  UtcOffsetHours?: number
  AyanamsaType?: string
  Language?: string
}
export const calculateChartGuest = (body: ChartRequest) =>
  guestApi.post('/api/chart/guest', body)

export const calculateChart = (body: ChartRequest) =>
  chartApi.post('/api/chart/calculate', body)

export const listCharts = () =>
  apiGet<any[]>('/api/chart/list')

export const getChart = (id: string) =>
  apiGet<any>(`/api/chart/${id}`)

export const getChartYogas = (id: string) =>
  apiGet<any>(`/api/chart/${id}/yogas`)

// ── CHART REPORT ──────────────────────────────────────────────
export const getGuestReport = (id: string) =>
  apiGet<any>(`/api/chart-report/guest/${id}`)

export const getStage1Report = (id: string) =>
  apiGet<any>(`/api/chart-report/${id}/stage1`)

// ── MATCH ─────────────────────────────────────────────────────
export const calculateMatch = (p1: any, p2: any) =>
  chartApi.post('/api/chart/calculate-match', { person1: p1, person2: p2 })

export const matchCharts = (p1: any, p2: any) =>
  chartApi.post('/api/chart/match', { Person1: p1, Person2: p2 })
    .catch(() => chartApi.post('/api/compat/score', { Person1: p1, Person2: p2 }))

// ── FORECAST ──────────────────────────────────────────────────
export const getForecast = (id: string, period: 'daily'|'weekly'|'monthly'|'yearly') =>
  apiGet<any>(`/api/forecast/${id}/${period}`)

// ── TRANSITS ──────────────────────────────────────────────────
export const getGochara = (id: string) =>
  apiGet<any>(`/api/transit/${id}/gochara`)

export const getSadeSati = (id: string) =>
  apiGet<any>(`/api/transit/${id}/sadesati/detail`)

// ── PREDICTION ────────────────────────────────────────────────
export const getPeriodAnalysis = (id: string) =>
  apiGet<any>(`/api/prediction/${id}/period-analysis`)

export const getCurrentScores = (id: string) =>
  apiGet<any>(`/api/prediction/${id}/current-domain-scores`)

// ── DOSHA ─────────────────────────────────────────────────────
export const getDoshas = (id: string) =>
  apiGet<any>(`/api/dosha/${id}`)

// ── REMEDIES ──────────────────────────────────────────────────
export const getGemstones = () =>
  apiGet<any[]>('/api/remedies/gemstones')

export const getRemedies = (id: string) =>
  apiGet<any>(`/api/remedies/${id}`)

// ── NUMEROLOGY ────────────────────────────────────────────────
export const calcNumerology = (name: string, day: number, month: number, year: number) =>
  chartApi.post('/api/numerology/calculate', { name, day, month, year })

// ── MUHURTA ───────────────────────────────────────────────────
export const calcMuhurta = (body: any) =>
  chartApi.post('/api/muhurta/calculate', body)

// ── ASTROLOGERS (public) ──────────────────────────────────────
export const getAstrologers = () =>
  apiGet<any[]>('/api/astrologer/available')

// ── SESSION ───────────────────────────────────────────────────
export const getAgoraToken = (channel: string) =>
  apiGet<any>(`/api/session/agora-token?channel=${channel}`)

export const startSession = (body: any) =>
  apiPost<any>('/api/session/start', body)

// ── PAYMENTS ──────────────────────────────────────────────────
export const getPacks = () =>
  apiGet<any[]>('/api/payments/packs')

export const createRazorpayOrder = (packId: number) =>
  chartApi.post('/api/payments/razorpay/create-order', { packId, currency: 'INR' })

export const verifyPayment = (body: any) =>
  chartApi.post('/api/payments/razorpay/verify', body)

// ── VARSHAPHAL ────────────────────────────────────────────────
export const getVarshaphal = (id: string, year: number) =>
  apiGet<any>(`/api/compat/${id}/${year}`)

export const getVarshaphalMonthly = (id: string, year: number) =>
  apiGet<any>(`/api/compat/${id}/${year}/monthly`)

// ── OTP ─────────────────────────────────────────────────────
export const sendEmailOtp   = (email: string) =>
  authApi.post('/api/auth/email-otp/send', { email })
export const verifyEmailOtp = (email: string, otp: string) =>
  authApi.post('/api/auth/email-otp/verify', { email, otp })
export const sendPhoneOtp   = (phone: string) =>
  authApi.post('/api/auth/otp/send', { phone })
export const verifyPhoneOtp = (phone: string, otp: string) =>
  authApi.post('/api/auth/otp/verify', { phone, otp })

// ── PDF ──────────────────────────────────────────────────────
export const getPdfBasic = (horoId: string) =>
  chartApi.get(`/api/pdf/chart/${horoId}/basic`, { responseType: 'blob' })
// ── STRENGTH (Shadbala, Ashtakavarga, Varga) ─────────────────
export const getShadbala      = (id: string) => chartApi.get(`/api/strength/${id}/shadbala`)
export const getAshtakavarga  = (id: string) => chartApi.get(`/api/strength/${id}/ashtakavarga`)
export const getVargaChart    = (id: string, divisor: number) => chartApi.get(`/api/strength/${id}/varga/${divisor}`)
export const getStrengthNatal = (id: string) => chartApi.get(`/api/strength/natal/${id}`)

// ── SPECIAL LAGNAS (Arudha etc) ───────────────────────────────
export const getSpecialLagnas = (id: string) => chartApi.get(`/api/transit/${id}/special-lagnas`)

// ── DOSHAS ────────────────────────────────────────────────────
export const getMangalDosha   = (id: string) => chartApi.get(`/api/dosha/${id}/mangal`)
export const getKaalsarpa     = (id: string) => chartApi.get(`/api/dosha/${id}/kaalsarpa`)

// ── FORECAST ──────────────────────────────────────────────────
export const getForecastDaily   = (id: string) => chartApi.get(`/api/forecast/${id}/daily`)
export const getForecastWeekly  = (id: string) => chartApi.get(`/api/forecast/${id}/weekly`)
export const getForecastMonthly = (id: string) => chartApi.get(`/api/forecast/${id}/monthly`)

// ── INTERPRET ─────────────────────────────────────────────────
export const getInterpret        = (id: string) => chartApi.get(`/api/interpret/${id}`)
export const getInterpretPersonality = (id: string) => chartApi.get(`/api/interpret/${id}/personality`)
export const getInterpretMarriage    = (id: string) => chartApi.get(`/api/interpret/${id}/marriage`)
export const getInterpretCareer      = (id: string) => chartApi.get(`/api/interpret/${id}/career`)
export const getInterpretCurrentPeriod = (id: string) => chartApi.get(`/api/interpret/${id}/current-period`)

// ── CHART REPORT ──────────────────────────────────────────────
export const getChartReportStage1 = (id: string) => chartApi.get(`/api/chart-report/${id}/stage1`)
export const getChartReportStage2 = (id: string) => chartApi.get(`/api/chart-report/${id}/stage2`)

// ── PDF (blob) ────────────────────────────────────────────────
export const downloadPdfBasic = (id: string) =>
  chartApi.get(`/api/pdf/chart/${id}/basic`, { responseType: 'blob' })
export const downloadPdfFull  = (id: string) =>
  chartApi.get(`/api/pdf/chart/${id}/full`,  { responseType: 'blob' })

// ── PREDICTION EXTRAS ─────────────────────────────────────────
export const getGoodBadTimes    = (id: string) => chartApi.get(`/api/prediction/${id}/good-bad-times`)
export const getDifficultPeriods= (id: string) => chartApi.get(`/api/prediction/${id}/difficult-periods`)
export const getGoodPeriods     = (id: string) => chartApi.get(`/api/prediction/${id}/good-periods`)
