
const  path = require('path'),
       fs = require('fs'),
       os = require('os'),
       reader = require('xlsx'),
       request = require('request'),
       DataStore = require('nedb'),
       {exec} = require('child_process');

// REPO ////////////////////////////////////////////////////////////////////////
var {aappuser} = require('./bin/repo/ds/users/vogel-users.js');
var {app,ipcMain,BrowserWindow,viewtools} = require('./bin/repo/tools/box/electronviewtool.js');
var {loginroutes}=require('./bin/repo/gui/js/modules/login.js');
////////////////////////////////////////////////////////////////////////////////

//Midleware //////////////////////////
var controlsroot = path.join(__dirname,'/controllers/'); //dir path to views
var appset = require('./app/settings.json');//appset.dev.on = true;
var au = require('./bin/appuser.js'); //initialize the app user object
var {navroutes}=require('./bin/routes.js');
//////////////////////////////////////

//TEST CODE/////////////////////////////////////////////////////////////////////

var {aserviceitem,vjserviceitemmap} = require('./bin/repo/ds/customers/vogel-serviceitems.js');
var {acustomer,vjcustomermap}=require('./bin/repo/ds/customers/vogel-customers.js');
var {aservicecontract,vjservicecontractmap}=require('./bin/repo/ds/contracts/vogel-servicecontracts.js');
var {awo,vjwomap}=require('./bin/repo/ds/wos/vogel-wos.js');
var {excelTOjson,jsonTOexcel}=require('./bin/repo/tools/ioconvert/excel-io.js');
var reportSC = require('./bin/repo/tools/reporting/reporting-servicecontracts.js');
var reportWO = require('./bin/repo/tools/reporting/reporting-wos.js');

////////////////////////////////////////////////////////////////////////////////

var SCEOMfile = path.join(au.auser.cuser.spdrive,'Vogel - IM/dev/SharePoint/Vogel - Service/Daily WOs/Reports/SC-EOM.xlsx');

// DB /////////////////////////
var jtablesroot = path.join(au.auser.cuser.spdrive,'/Vogel - IM/store/jonas/');
var dbroot = path.join(au.auser.cuser.spdrive,'/Vogel - IM/store/');

var jonastablelog = require('./app/vjtablelog.json'); //jonas table log;
var sclist;
var silist;
var wolist;

var SETjonastables=()=>{//get reporting list
  sclist = require(jtablesroot + 'json/vj-service-contracts.json');
  silist = require(jtablesroot + 'json/vj-serv-items.json');
  wolist = require(jtablesroot + 'json/vj-wos.json');
}
var REFRESHjonastables=()=>{
  for(let jt in jonastablelog){ //Load all JONAS tables
    let vjmap=()=>{return{}};
    switch(jt){
      case 'service_items':vjmap=vjserviceitemmap;break;
      //case 'customers':vjmap=vjcustomermap;break;
      case 'service_contracts':vjmap=vjservicecontractmap;break;
      //case 'wos':vjmap=vjwomap;
    }
    try{
      excelTOjson(
        path.join(jtablesroot,jonastablelog[jt].excelfile),
        path.join(jtablesroot,'/JSON/',jonastablelog[jt].jsonfile),
        'MAIN',
        vjmap
      );
      console.log(jt,' Load Success')
    }catch{console.log(jt,' Load Failed')}
  }

  SETjonastables();
}
////////////////////////////////

SETjonastables();



////////////////////////////////////////////////////////////////////////////////

var mainv; //holds the main BrowserWindow

require('dns').resolve('www.google.com',(err)=>{ //test for internet connection
  if(err){//is not connected
  }
  else{//is connected
  }
});

/* LANDING PAGE
    The landing page will more often be the login screen
    This login screen can be skipped by editing the
    appset.dev.on = true. This will default to main.html
    If the developer wants to skip to a page, the
    appset.dev.page = '' can have a desired page file
    name
*/
app.on('ready',(eve)=>{
  if(!appset.dev.on){
    if(appset.users[au.auser.uname]==undefined){
      mainv = viewtools.loader(controlsroot + 'login.html',1080,750,false,false,'hidden');
    }else{
      try{//attempt to open users default page
        mainv = viewtools.loader(controlsroot + appset.groups[au.auser.config.group].main,1080,750,false,false,'hidden');
      }catch{mainv = viewtools.loader(controlsroot + 'login.html',1080,750,false,false,'hidden');}
    }
    mainv.on('close',(eve)=>{ //any app closing code below
    });
  }else{appset.dev.page==''?mainv = viewtools.loader(controlsroot+'main.html',1080,750,false,false,false):mainv=viewtools.loader(controlsroot+appset.dev.page,1080,750,false,false,'hidden')}
});

/* APP login
    data:{
      user:'',
      pswrd:''
    }

    Recieve a user name and password from login form AND
    attach the application auth code to it. The api is
    queried to check both the auth code and the user
    credentials.

    If the access/login to the api is a success, the
    appset.users is checked for a match to the user name.

    If the user is found in appset.users, that users group
    view (appset.groups.main) 'dash' is loaded
*/
ipcMain.on(loginroutes.submit,(eve,data)=>{
  if(au.SETUPappuser(appset.users,data.uname,data.pswrd)){ //check to see if username matches app settings
    viewtools.swapper(mainv,controlsroot + appset.groups[au.auser.config.group].main,1080,750);
  }else{eve.sender.send(loginroutes.submit,{status:false,msg:'Not an app user',user:null})}
});

// Titlebar Request
ipcMain.on('view-minimize',(eve,data)=>{
  BrowserWindow.getFocusedWindow().minimize();
});

// Request login screen
ipcMain.on(navroutes.gotologin,(eve,data)=>{
  au.RESETappuser();
  console.log('login')
  viewtools.swapper(mainv,controlsroot + 'login.html',1080,750);
});

// EOM Reports ////////////////////////////////////////////////////

var repfile = require('./bin/back/report-filer.js');
ipcMain.on('setup-contracts',(eve,data)=>{
  repfile.GetReports('contract').then(res=>{eve.sender.send('setup-contracts',res)});
});

ipcMain.on('setup-wos',(eve,data)=>{
  repfile.GetReports('wo').then(res=>{eve.sender.send('setup-wos',res)});
});

ipcMain.on('setup-techs',(eve,data)=>{
  repfile.GetReports('tech').then(res=>{eve.sender.send('setup-techs',res)});
});


ipcMain.on('runEOM-sc',(eve,data)=>{
  let rep = {}
  if(data){
    rep.data =reportSC.RunEOM(sclist,['300'],data);
    eve.sender.send('runEOM-sc',{data:rep.data,month:data.getMonth()});
  }else{
    rep.data =reportSC.RunEOM(sclist,['300']);
    eve.sender.send('runEOM-sc',{data:rep.data,month:data.getMonth()});
  }
  repfile.FileReport('contract',rep,data.getMonth());
});


var sfilters = require('./bin/repo/tools/agreements/contract-filters.js');

ipcMain.on('Listcontractfilters',(eve,data)=>{
  jsonTOexcel(sfilters.MERGEsitemsTOagreements(silist,sclist),'MAIN',path.join(__dirname,'Test.xlsx'));
  eve.sender.send('Listcontractfilters',{msg:'Finished'});
});



ipcMain.on('runEOM-wo',(eve,data)=>{
  let rep = {};
  if(data){
    rep.data = reportWO.RunEOM(wolist,['300','400','450'],data.getMonth(),data.getYear());
    eve.sender.send('runEOM-wo',rep.data);
  }else{
    data = new Date();
    rep.data = reportWO.RunEOM(wolist,['300','400','450']);
    eve.sender.send('runEOM-wo',rep.data);
  }
  repfile.FileReport('wo',{data:rep.data},data.getMonth());
});

var techtools = require('./bin/back/tech-reporting.js');
//let techrepdbpath = path.join(au.auser.cuser.spdrive,'Vogel - Service/Commissions/Log/refreportlog.db');
let techrepdbpath = path.join('Y:/DB/store/referstore/refreportlog.db');

repfile.GetReports('tech').then(
  res=>{
    console.log(res);
  }
)
ipcMain.on('update-tech',(eve,data)=>{
  console.log('UPDATING TECHS');
  let db = new DataStore(techrepdbpath); //Commission report database
  db.loadDatabase();
  db.find({},(err,docs)=>{//get all reports
    if(docs){
      //want to find last RECORDED commission report
      for(let z=0;z<docs.length;z++){
        let rep = docs[z];//test with first doc
        for(let x=0;x<rep.ids.length;x++){ //loop through techs
          let list = []; //temporary array
          for(let y=0;y<rep.list.length;y++){
            if(rep.list[y].TechID == rep.ids[x].id){list.push(rep.list[y])}
          }
          techtools.UPDATEtechdb(rep.ids[x].id,list);
        }
        eve.sender.send('update-tech',rep.ids);
      }
    }
  })
});

ipcMain.on('runEOM-tech',(eve,data)=>{
  console.log('RUNNING',data);
  if(data){
    let runs = 0;
    let techreplist=[];
    for(let x=0;x<techtools.techlist.length;x++){
      techtools.UPDATEtechtracker(techtools.techlist[x].user).then(
        (rep)=>{
          techreplist.push({
            techuser:techtools.techlist[x].user,
            techname:techtools.techlist[x].name,
            commrep:rep,
            worep: techtools.RUNtechwo(wolist,techtools.techlist[x].id,new Date(data))
          });
          runs++;
          if(runs==techtools.techlist.length){
            eve.sender.send('runEOM-tech',{data:techreplist,month:data.getMonth()});
            repfile.FileReport('tech',{data:techreplist},data.getMonth());
          }
        }
      )
    }
  }
});
///////////////////////////////////////////////////////////////////

// JONAS Tables ///////////////////////////////////////////////////
ipcMain.on('jonas-refresh-tables',(eve,data)=>{
  REFRESHjonastables();
  /*
  for(let jt in jonastablelog){ //Load all JONAS tables
    let vjmap=()=>{return{}};
    switch(jt){
      case 'service_items':vjmap=vjserviceitemmap;break;
      case 'customers':vjmap=vjcustomermap;break;
      case 'service_contracts':vjmap=vjservicecontractmap;break;
      case 'wos':vjmap=vjwomap;
    }
    try{
      excelTOjson(
        path.join(jtablesroot,jonastablelog[jt].excelfile),
        path.join(jtablesroot,'/JSON/',jonastablelog[jt].jsonfile),
        'MAIN',
        vjmap
      );
      console.log(jt,' Load Success')
    }catch{console.log(jt,' Load Failed')}
  }

  SETjonastables();
  */
});
///////////////////////////////////////////////////////////////////


var PRINTscreen = (win,fpath =os.tmpdir(),fname ='print',open = true)=>{
  if(fpath && (win && win!=undefined)){
    try{
      let fullpath = path.join(fpath,fname+'.pdf');
      win.printToPDF({printBackground:true}).then(data => {
        fs.writeFile(fullpath, data, (error) => {
          if (!error){
            console.log(`Wrote PDF successfully to ${fpath}`)
            if(open){exec(path.join(fullpath).replace(/ /g,'^ '));}
          }else{console.log(`Failed to write PDF to ${fpath}: `, error)}
        });
      }).catch(error => {console.log(`Failed to write PDF to ${fpath}: `, error);win.send('print-screen',{msg:'File Open'});})
    }catch{console.log('Can not print')} //File is open, bring file into view
  }
}

ipcMain.on('print-screen',(eve,data)=>{
  if(data!=undefined){
    PRINTscreen(eve.sender,data.path,data.file);
  }else{PRINTscreen(eve.sender);}
});
