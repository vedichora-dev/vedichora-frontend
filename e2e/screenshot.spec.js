const { test } = require('@playwright/test')
const BASE = 'https://vedichora-frontend-orcin.vercel.app'

const SAMPLE_DATA = {
  lang: 'en',
  name1: 'Ganapathy', name2: 'Shreya',
  dob1: '22/8/1998', dob2: '17/10/2002',
  AshtaKootaScore: 27, AshtaKootaTotal: 36, AshtaKootaPct: 75,
  KootaDetails: [
    {kootaName:'Varna',score:1,maxScore:1},{kootaName:'Vashya',score:0.5,maxScore:2},
    {kootaName:'Tara',score:1.5,maxScore:3},{kootaName:'Yoni',score:3,maxScore:4},
    {kootaName:'Graha Maitri',score:0,maxScore:5},{kootaName:'Gana',score:6,maxScore:6},
    {kootaName:'Bhakoota',score:7,maxScore:7},{kootaName:'Nadi',score:8,maxScore:8},
  ],
  PathuPoruthamScore: 15, PathuPoruthamTotal: 24,
  Poruthams: [
    {kootaName:'Dinam',score:3,maxScore:3,verdict:'Compatible',pass:true,description:'Count 14 — Auspicious for health and prosperity.'},
    {kootaName:'Ganam',score:5,maxScore:5,verdict:'Compatible',pass:true,description:'Bride: Rakshasa Gana, Groom: Rakshasa Gana. Same Gana — excellent temperament match.'},
    {kootaName:'Mahendram',score:0,maxScore:1,verdict:'Incompatible',pass:false,description:'Mahendram not present.'},
    {kootaName:'Sthree Dheerga',score:3,maxScore:3,verdict:'Compatible',pass:true,description:"Groom's rasi is 7 signs from bride's. Good — longevity of wife indicated."},
    {kootaName:'Yoni',score:3,maxScore:4,verdict:'Compatible',pass:true,description:'Bride: Buffalo, Groom: Buffalo. Score: 3/4.'},
    {kootaName:'Rasi',score:1,maxScore:2,verdict:'Compatible',pass:true,description:'Bride: Aquarius, Groom: Leo. Friendly rasis.'},
    {kootaName:'Rasiyathipati',score:0,maxScore:5,verdict:'Incompatible',pass:false,description:'Moon sign lords are unfriendly.'},
    {kootaName:'Vasiya',score:0,maxScore:2,verdict:'Incompatible',pass:false,description:'Vasiya not present.'},
  ],
  RajjuPass: true, RajjuWarning: '',
  BrideRajju: 'Kati', GroomRajju: 'Padam',
  VedhaPresent: false, VedhaWarning: '',
  MahendramPresent: false, MangalDosha: false,
  IsRecommended: true,
  Summary: 'Strong match — 27/36 Ashta Koota. Rajju and Vedha clear. Gana compatibility excellent.',
  GroomNakshatra: 'Magha', BrideNakshatra: 'Shatabhisha',
  GroomRasi: 'Leo', BrideRasi: 'Aquarius',
}

test('PDF report template renders', async ({ page }) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 900, height: 1200 })

  // Fetch the template and inject data
  const resp = await page.request.get(BASE + '/porutham-report.html')
  let html = await resp.text()

  // Inject data before </head>
  const dataScript = '<script>window.__VH_DATA = ' + JSON.stringify(SAMPLE_DATA) + ';</script>'
  html = html.replace('</head>', dataScript + '</head>')
  
  // Remove the print() call so it doesn't block
  html = html.replace("setTimeout(() => { try { win.print() } catch {} }, 800)", "")
  html = html.replace('onclick="window.print()"', 'onclick="console.log('print')"')

  // Write to page
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  // Check text
  const bodyText = await page.locator('body').innerText()
  const lines = bodyText.split('\n').map(l=>l.trim()).filter(l=>l.length>2)
  console.log('REPORT_TEXT:' + lines.slice(0,100).join(' | '))

  // Screenshot each section
  const fullH = await page.evaluate(() => document.body.scrollHeight)
  console.log('PAGE_HEIGHT:' + fullH)

  await page.screenshot({ path:'screenshots/r01_cover.png', clip:{x:0,y:0,width:900,height:900} })
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(300)
  await page.screenshot({ path:'screenshots/r02_birth_scores.png', clip:{x:0,y:0,width:900,height:900} })
  await page.evaluate(() => window.scrollTo(0, 1800))
  await page.waitForTimeout(300)
  await page.screenshot({ path:'screenshots/r03_pathu_table.png', clip:{x:0,y:0,width:900,height:900} })
  await page.evaluate(() => window.scrollTo(0, 2700))
  await page.waitForTimeout(300)
  await page.screenshot({ path:'screenshots/r04_ashta_table.png', clip:{x:0,y:0,width:900,height:900} })
  await page.evaluate(() => window.scrollTo(0, 3600))
  await page.waitForTimeout(300)
  await page.screenshot({ path:'screenshots/r05_verdict.png', clip:{x:0,y:0,width:900,height:900} })
  await page.screenshot({ path:'screenshots/r00_full.png', fullPage:true })
  console.log('ALL_SS_DONE')
})
