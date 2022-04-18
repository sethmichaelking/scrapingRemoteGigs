const puppeteer = require("puppeteer");

let jobs = []

module.exports.run = async () => {
 const browser = await puppeteer.launch()
 const page = await browser.newPage()
 await page.goto('https://remoteok.com/remote-dev-jobs')
 await loadLatestJobs(page)
 console.log("Latest Jobs: ", jobs)

 await browser.close()
}

async function getPropertyValue(element, propertyName){
  const property = await element.getProperty(propertyName)
  return await property.jsonValue()
}


function addJob(title, company, ...technology) {
  if (jobs) {
    const job = { title, company, technology }
    jobs.push(job)
  }
}

async function loadLatestJobs(page) {
  const jobs = []
  const todaysJob = await page.$("tbody")
  const bodyRows = await todaysJob.$$("tr")
  const rowsMapping = bodyRows.map(async(row) => {
    const jobTitleElement = await row.$('[itemprop=title')
    //not every title is there
    if(jobTitleElement){
      const titleValue = await getPropertyValue(jobTitleElement, 'innerText')
      const hiringOrganization = await row.$('[itemprop="hiringOrganization"]')
      let orginzationName = ""
      let technology = []
      if (hiringOrganization) {
        orginzationName = await getPropertyValue(hiringOrganization, 'innerText')
      }
      //2 $$s means look at all the
      const tags = await row.$$(".tag")
      technology = await Promise.all(tags.map(async (tag) => {
        const tagContent = await tag.$("h3")
        return (await getPropertyValue(tagContent, 'innerText'))
        .toLowerCase()
      }))
      //remove duplicates
      technology = [...new Set(technology)]
      //add job
      addJob(titleValue, orginzationName, ...technology)
    }

  });
  await Promise.all(rowsMapping)

}


module.exports.run()