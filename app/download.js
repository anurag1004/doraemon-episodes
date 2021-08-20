const fs = require('fs');
const axios = require("axios");
const cheerio = require("cheerio");
const ProgressBar = require('progress');
const base_url = "http://ep.dl.hm-cloud.cf/";
const prompt = require('prompt-sync')({sigint: true});
const puppeteer = require('puppeteer');
const chalk = require('chalk');
const figlet = require('figlet');

async function download(linkObj, num){
    // return new Promise((res, rej)=>{
    //     const file = fs.createWriteStream("./downloads/"+linkObj.title);
    //     const request = http.get(linkObj.href, (response)=>{
    //       response.pipe(file);
    //     });
    //     res()
    // })
    await fs.promises.mkdir('./downloads/season'+num, { recursive: true }).catch(console.error);
    const url = linkObj.href;
    if(!linkObj.title.includes(".mp4") || !linkObj.title.includes(".mkv") )
        linkObj.title+=".mp4";
    // if already exists return
    if (fs.existsSync("./downloads/season"+num+"/"+linkObj.title)) {
        return;
    }
    const writer = fs.createWriteStream("./downloads/season"+num+"/"+linkObj.title);
  
    const { data, headers} = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    })
    const totalLength = headers['content-length']
    const progressBar = new ProgressBar(chalk.red('-> ') + chalk.green.bold('Downloading [:bar] :percent :etas'), {
        width: 40,
        complete: chalk.yellow('='),
        incomplete: ' ',
        renderThrottle: 1,
        total: parseInt(totalLength)
    })
    data.on('data',(chunk) => progressBar.tick(chunk.length))
    data.pipe(writer)
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
}
async function scrapeAndDownload(url, num){
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(url)

    let i = 0; // dot counter
    const waiting = setInterval(function() {
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        i = (i + 1) % 6;
        var dots = new Array(i + 1).join(".");
        process.stdout.write(chalk.green("Preparing resources" + dots));  // write text
      }, 200);
    await page.waitForSelector(".list-group-item .list-group-item-action")
    clearInterval(waiting);
    console.log('\n')
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);
    const $ = cheerio.load(data)
    const linkObjects = $('#list a');
    // this is a mass object, not an array

    // Collect the "href" and "title" of each link and add them to an array
    const links = [];
    let title = "";
    // console.log(linkObjects.children());
    linkObjects.each((index, element) => {
        const text  = $(element).text().trim();
        if(text.length==0){
            links.push({
                title, // get the text
                href: $(element).attr('href'), // get the href attribute
            });
        }else{
            title = text;
        }
    });
    await browser.close();
    // console.log(links)
    for (const link of links) {
        console.log("Starting... "+link.title)
        await download(link, num).catch(err=>console.log(err))
    }
}
async function downloadSeasons(from, to){
    for(let i=from;i<=to;i++){
        let season = base_url+i+":/";
        let season_txt  = 'SEASON - '+i;
        const formatted_text = await new Promise((res, rej)=>{
            figlet.text(season_txt, {
                horizontalLayout: 'fitted',
                verticalLayout: 'fitted',
                width: 80,
                whitespaceBreak: false
            }, function(err, data) {
                if (err) {
                    rej(err)
                }
                res(data)
            });
        }).catch(err=>{
            console.log(err)
        })
        console.log(chalk.magenta(formatted_text));
        await scrapeAndDownload(season, i);
    }
}
async function start(){
    // Display ASCII ART
    const ascii_art = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀           ⢀⣠⣤⣴⣶⣶⣶⣶⣶⠶⣶⣤⣤⣀          ⠀⠀⠀⠀⠀    |
    ⠀⠀⠀⠀⠀⠀⠀      ⢀⣤⣾⣿⣿⣿⠁⠀⢀⠈⢿⢀⣀⠀⠹⣿⣿⣿⣦⣄⠀⠀⠀              |
    ⠀⠀⠀⠀⠀⠀      ⣴⣿⣿⣿⣿⣿⠿⠀⠀⣟⡇⢘⣾⣽⠀⠀⡏⠉⠙⢛⣿⣷⡖⠀              |
    ⠀⠀⠀⠀⠀      ⣾⣿⣿⡿⠿⠷⠶⠤⠙⠒⠀⠒⢻⣿⣿⡷⠋⠀⠴⠞⠋⠁⢙⣿⣄              |
    ⠀⠀⠀⠀      ⢸⣿⣿⣯⣤⣤⣤⣤⣤⡄⠀⠀⠀⠀⠉⢹⡄⠀⠀⠀⠛⠛⠋⠉⠹⡇              |
    ⠀⠀⠀⠀      ⢸⣿⣿⠀⠀⠀⣀⣠⣤⣤⣤⣤⣤⣤⣤⣼⣇⣀⣀⣀⣛⣛⣒⣲⢾⡷              |
          ⢀⠤⠒⠒⢼⣿⣿⠶⠞⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⣼⠃              |
          ⢮⠀⠀⠀⠀⣿⣿⣆⠀⠀⠻⣿⡿⠛⠉⠉⠁⠀⠉⠉⠛⠿⣿⣿⠟⠁⠀⣼⠃⠀              |
          ⠈⠓⠶⣶⣾⣿⣿⣿⣧⡀⠀⠈⠒⢤⣀⣀⡀⠀⠀⣀⣀⡠⠚⠁⠀⢀⡼⠃⠀⠀              |
    ⠀⠀⠀      ⠈⢿⣿⣿⣿⣿⣿⣷⣤⣤⣤⣤⣭⣭⣭⣭⣭⣥⣤⣤⣤⣴⣟⠁                 |`;
    console.log(chalk.inverse.blue(ascii_art))
    const text = await new Promise((res, rej)=>{
        figlet('DORAEMON', function(err, data) {
            if (err) {
                rej(err)
            }
            res(data)
        });
    }).catch(err=>{
        console.log(err)
    })
    if(!fs.existsSync('./downlods')){
        await fs.promises.mkdir('./downloads').catch(err=>{console.log(err)})
    }
    console.log(chalk.blue(text))
    console.log(chalk.cyan.bold("Download Doraemon Hindi Episodes ! [From Seasons 1-18]"))
    console.log("Enter range of Seasons you want to download " + chalk.greenBright("[from-to]"))
    let from  = prompt("From (Must be a Number): ");
    let to = prompt("To (Must be a Number): ");
    if(Number.isInteger(Number(from)) && Number.isInteger(Number(to))){
        from = Number(from)
        to = Number(to)
        if(from >=1 && to <= 18){
            await downloadSeasons(from,to);
        }
    }
}
start()