const { test } = require('@playwright/test')
const BASE = 'https://vedichora-frontend-orcin.vercel.app'

const SAMPLE = {
  lang:'en',name1:'Ganapathy',name2:'Shreya',dob1:'22/8/1998',dob2:'17/10/2002',
  AshtaKootaScore:27,AshtaKootaTotal:36,AshtaKootaPct:75,
  KootaDetails:[
    {kootaName:'Varna',score:1,maxScore:1},{kootaName:'Vashya',score:0.5,maxScore:2},
    {kootaName:'Tara',score:1.5,maxScore:3},{kootaName:'Yoni',score:3,maxScore:4},
    {kootaName:'Graha Maitri',score:0,maxScore:5},{kootaName:'Gana',score:6,maxScore:6},
    {kootaName:'Bhakoota',score:7,maxScore:7},{kootaName:'Nadi',score:8,maxScore:8},
  ],
  PathuPoruthamScore:15,PathuPoruthamTotal:24,
  Poruthams:[
    {kootaName:'Dinam',score:3,maxScore:3,verdict:'Compatible',pass:true,description:'Count 14 mod 9 = 5 — Auspicious for health and prosperity.'},
    {kootaName:'Ganam',score:5,maxScore:5,verdict:'Compatible',pass:true,description:'Bride: Rakshasa Gana, Groom: Rakshasa Gana. Same Gana — excellent temperament match.'},
    {kootaName:'Mahendram',score:0,maxScore:1,verdict:'Incompatible',pass:false,description:'Mahendram not present.'},
    {kootaName:'Sthree Dheerga',score:3,maxScore:3,verdict:'Compatible',pass:true,description:'Groom rasi is 7 signs from bride. Good — longevity of wife indicated.'},
    {kootaName:'Yoni',score:3,maxScore:4,verdict:'Compatible',pass:true,description:'Bride: Buffalo, Groom: Buffalo. Score: 3/4.'},
    {kootaName:'Rasi',score:1,maxScore:2,verdict:'Compatible',pass:true,description:'Bride: Aquarius, Groom: Leo. Friendly rasis.'},
    {kootaName:'Rasiyathipati',score:0,maxScore:5,verdict:'Incompatible',pass:false,description:'Moon lords are unfriendly.'},
    {kootaName:'Vasiya',score:0,maxScore:2,verdict:'Incompatible',pass:false,description:'Vasiya not present.'},
  ],
  RajjuPass:true,RajjuWarning:'',BrideRajju:'Kati',GroomRajju:'Padam',
  VedhaPresent:false,VedhaWarning:'',MahendramPresent:false,MangalDosha:false,
  IsRecommended:true,
  Summary:'Strong match — 27/36 Ashta Koota. Rajju and Vedha clear.',
  GroomNakshatra:'Magha',BrideNakshatra:'Shatabhisha',
  GroomRasi:'Leo',BrideRasi:'Aquarius',
}

test('PDF report template', async ({ page }) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 900, height: 1200 })

  const resp = await page.request.get(BASE + '/porutham-report.html')
  let html = await resp.text()

  const dataScript = '<script>window.__VH_DATA = ' + JSON.stringify(SAMPLE) + ';<\/script>'
  html = html.replace('<\/head>', dataScript + '<\/head>')
  html = html.replace(/window\.print\(\)/g, 'console.log("print")')

  await page.setContent(html, { waitUntil:'domcontentloaded' })
  await page.waitForTimeout(1500)

  const bodyText = await page.locator('body').innerText()
  const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 2)
  console.log('TEXT:' + lines.slice(0, 100).join(' | '))

  for (const [name, y] of [['r01_cover',0],['r02_birth',900],['r03_pathu',1800],['r04_ashta',2700],['r05_verdict',3600]]) {
    await page.evaluate(yy => window.scrollTo(0, yy), y)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'screenshots/' + name + '.png', clip:{x:0,y:0,width:900,height:900} })
  }
  await page.screenshot({ path: 'screenshots/r00_full.png', fullPage:true })
  console.log('DONE')
})
