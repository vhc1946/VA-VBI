var DataStore = require('nedb');
var path = require('path');
var auser = require('../repo/ds/users/vogel-users.js').aappuser();

var {ObjList} = require('../repo/tools/box/vg-lists.js');
var {NEDBconnect}=require('../repo/tools/box/nedb-connector.js');
var datetools=require('../repo/tools/box/vg-dating.js');

var japimart = require('../repo/apis/japi/japimart.js');
var vapistore = require('../repo/apis/vapi/vapistore.js');
var vapiconnects = require('../../app/settings.json').apis;

var techcommdb = path.join(auser.cuser.spdrive,'Vogel - Service/Commissions/Log/techs/');
var techlist = require('../../app/techdb.json');

var tdb ={};
var vapiapp='REPORTING'; //appstore name
/* tables
  - wojournal_currmonth
  - wojournal_curryear
  - wojournal_historic

  - wolist_currmonth
  - wolist_curryear
  - wolist
*/

var UPDATEtechdb = (techid,list)=>{
  if(tdb[techid]==undefined){
    tdb[techid] = new DataStore(techcommdb+techid+'.db');
    tdb[techid].loadDatabase();
    tdb[techid].ensureIndex({fieldName:'FormID',unique:true});
  }
  for(let x=0;x<list.length;x++){
    //if(list[x].status!='O'){
      tdb[techid].insert(list[x],(err,doc)=>{
        if(err){}
        else if(!doc){
          tdb[techid].update({FormID:list[x].FormID},{$set:list[x]},(err,num)=>{
            if(err){console.log('UPDATE');}
            console.log(num)
          });
        }
      });
    //}else{}
  }

}

var UPDATEtechtracker = (techid)=>{
  return new Promise((resolve,reject)=>{
    if(tdb[techid]==undefined){
      console.log('tracking')
      tdb[techid] = new DataStore(techcommdb+techid+'.db');
      tdb[techid].loadDatabase();
      tdb[techid].ensureIndex({fieldName:'FormID',unique:true});
    }
    let report = {
      FormID:'REPORT',
      lastupdate:'',
      submitted: 0,
      open:0,
      approved: 0,
      lost:0,
      paid: 0,
      bytype:{}
    }
    tdb[techid].find({},(err,docs)=>{
      if(docs){
        for(let x=0;x<docs.length;x++){
          if(docs[x].FormID != 'REPORT'){
            report.submitted++;
            if(report.bytype[docs[x].SpiffFor]==undefined){
              report.bytype[docs[x].SpiffFor]={
                approved:0,
                lost:0,
                open:0,
                paid:0
              }
            }
            report.paid+=Number(docs[x].paid);
            report.bytype[docs[x].SpiffFor].paid+=Number(docs[x].paid);

            if(docs[x].paid!=0){
              report.approved++;
              report.bytype[docs[x].SpiffFor].approved++;
            }
            else if(docs[x].status=='D'){
              report.lost++;
              report.bytype[docs[x].SpiffFor].lost++;
            }
            else if(docs[x].status=='O'){
              report.open++;
              report.bytype[docs[x].SpiffFor].open++;
            }
          }
        }
        tdb[techid].update({FormID:report.FormID},{$set:report},(err,num)=>{

          if(err || num ==0){
            tdb[techid].insert(report,(err,doc)=>{
              if(err){console.log('INSERT');}
              else if(!doc){}
            })
          }
        });
      }else{console.log(3)}
      return resolve(report);
    });
  });
}

var RUNtechwo =(list,techid,tdate=new Date())=>{
  let mlist = new ObjList(list);
  mlist.SETlist(mlist.TRIMlist({tech:techid}));
  let two = {
    wos:0,
    hours:0,
    revenue:0,
    revphour:0,
    revpday:0,
    revpwo:0
  }
  let ytdwo ={
    wos:0,
    hours:0,
    revenue:0,
    revphour:0,
    revpday:0,
    revpwo:0
  }
  let trndwo ={
    wos:0,
    hours:0,
    revenue:0,
    revphour:0,
    revpday:0,
    revpwo:0
  }
  for(let y=0;y<mlist.list.length;y++){
      //try{
        if(mlist.list[y].strtDate!=''||mlist.list[y].strtDate!=undefined){
          let wodate = new Date(mlist.list[y].strtDate);
          if(wodate.getMonth()==tdate.getMonth() && wodate.getYear()==tdate.getYear()){
            two.wos++;
            two.hours+=mlist.list[y].labHours;
            two.revenue-=mlist.list[y].billed;
          }
          if(wodate > new Date(tdate).setMonth(tdate.getMonth()-12)){
            ytdwo.wos++;
            ytdwo.hours+=mlist.list[y].labHours;
            ytdwo.revenue-=mlist.list[y].billed;
          }
          if(wodate > new Date(tdate).setMonth(tdate.getMonth()-6)){
            trndwo.wos++;
            trndwo.hours+=mlist.list[y].labHours;
            trndwo.revenue-=mlist.list[y].billed;
          }
        }
      //}catch{console.log(mlist.list[y])}
      two.revenue=Math.abs(two.revenue);
      two.revpwo = two.wos!=0?two.revenue/two.wos:0;
      two.revphour=two.hours!=0?two.revenue/two.hours:0;

      ytdwo.revenue=Math.abs(ytdwo.revenue);
      ytdwo.revpwo = ytdwo.wos!=0?ytdwo.revenue/ytdwo.wos:0;
      ytdwo.revphour=ytdwo.hours!=0?ytdwo.revenue/ytdwo.hours:0;

      trndwo.revenue=Math.abs(trndwo.revenue);
      trndwo.revpwo = trndwo.wos!=0?trndwo.revenue/trndwo.wos:0;
      trndwo.revphour=trndwo.hours!=0?trndwo.revenue/trndwo.hours:0;
    }
    return {two,ytdwo,trndwo};
}

/* Create tech report with given list
    Returns a report on the passed list

    PASSED:
    - list:[] (array of items from table wod(JAPI))
    - techid:'techid' (to sort list)

    USED:
    - run month
    - run last 6 months
    - run last 12 months
    - run on any range

*/
var CREATEtechreport = (list=[],techid)=>{
  let Llist = new ObjList(list).TRIMlist({EmployeeCode:techid}); //Labor list
  let Blist = new ObjList(list).TRIMlist({CostType:'B'}) //Billing List

  let wolist = {}; //store individual WOs
  let report = {
    wos:0,
    days:0,//get number of days in report
    hours:0,
    revenue:0,
    revphour:0,
    revpday:0,
    revpwo:0
  }

  for(let y=0;y<Llist.length;y++){
    if(wolist[Llist[y].WorkOrderNumber]==undefined){// Work Order has not been counted
      wolist[Llist[y].WorkOrderNumber]={ //add work
        count:1,
        hours:0,
        revenue:0,
      };
      report.wos++;
    }
    else{
      wolist[Llist[y].WorkOrderNumber].count++;
      switch(Llist[y].CostType){
        case 'L':{
          if(!Llist[y].HoursUnits){Llist[y].HoursUnits=0;}
          wolist.hours+=Llist[y].HoursUnits;
          report.hours+=Llist[y].HoursUnits;
          break
        }
        case 'M':{}
      }
    }
  }

  for(let x=0;x<Blist.length;x++){
    if(wolist[Blist[x].WorkOrderNumber]){
      if(!Blist[x].Amount){Blist[x].Amount=0;}
      wolist[Blist[x].WorkOrderNumber].revenue-=Blist[x].Amount;
      report.revenue-=Blist[x].Amount;
    }
  }

  report.revenue=Math.abs(report.revenue);
  report.revpwo = report.wos!=0?report.revenue/report.wos:0;
  report.revphour=report.hours!=0?report.revenue/report.hours:0;

  return {
    rundate:new Date().toISOString(),
    techid:techid,
    report:report,
    wolist:wolist
  }
}

/* UPDATE/REFRESH current tech month
    Can be run on startup, and called when a refresh is
    needed.

    Alone, the function checks to see if the report has
    been updated by any user that day. If it has not, a
    request is made from japi for the month to date. If
    the report has been updated, then nothing happends.

    The update can be forced by passing TRUE to the sync
*/
var UPDATEtechmonth=(sync=false)=>{
  return new Promise((res,rej)=>{
    let today = new Date();
    let fromday = new Date();
    vapistore.SENDrequest(vapiconnects[vapiapp].url,vapiapp,
    { db:'wojournal_currmonth',
      method:'query',
      options:{
        query:{id:'TABLEINFO'}
      }
    }).then(//process repsonse from VAPI
     vres=>{
       let atableinfo = (ti={})=>{ //quick map for table info
         if(!ti||ti==undefined){ti={}}
         return{
           id:'TABLEINFO',
           updatedon:ti.updatedon||null,
           updateuser:ti.updateuser||auser.cuser.uname,
           month:ti.month||today.getMonth()
         }
       }
       let tableinfo = null;//atableinfo()
       if(!vres.err&&vres.data.success){//request for TABLEINFO failed
          tableinfo = atableinfo(vres.data.body.result[0]);
          if(tableinfo.month<0||tableinfo.month>=12) {sync=true;} //confirm good month
          else if(tableinfo.month!=today.getMonth()) {console.log('attempt clean')/*CLEANtechmonth();sync=true;*/} //clean month and sync
          else if(!tableinfo.updatedon||today.toISOString().split('T')[0]!=tableinfo.updatedon) {sync=true;}
       }else if(vres.err.syscall!=undefined&&vres.err.syscall=='connect'){return res({update:false,msg:'Cannot Connect to VAPI'});}
       else{sync=true}

       if(sync){ //update the table
         let GETtable = new Promise((tres,trej)=>{ //get a table from somwhere
            fromday = new Date(`${today.getYear()+1900}-${today.getMonth()+1}-01`).toISOString().split('T')[0];//get first date of month
            japimart.GETj2vtable({
              table:'wod',
              params:{
                fromdate:fromday,
                todate:today.toISOString().split('T')[0]
              }
            }).then(
              jpack=>{return tres({success:jpack.success,table:jpack.table});}
            );
         });

         GETtable.then(//process found table
           pack=>{
             console.log(pack)
             if(pack.success&&pack.table.length>0){
               for(let x=0;x<pack.table.length;x++){pack.table[x].id='ITEM'} //correct items
               vapistore.SENDrequest(vapiconnects[vapiapp].url,vapiapp,
               { db:'wojournal_currmonth',
                 method:'remove',
                 options:{query:{}}
               }).then(
                 removal=>{
                   tableinfo.updatedon = today.toISOString().split('T')[0];
                   tableinfo.updateuser = auser.cuser.uname;
                   tableinfo.month = today.getMonth();
                   pack.table.push(tableinfo);
                   vapistore.SENDrequest(vapiconnects[vapiapp].url,vapiapp,
                   { db:'wojournal_currmonth',
                     method:'insert',
                     options:{docs:pack.table}
                   });
                 }
               );
               let techreports = [];
               for(let x=0;x<techlist.length;x++){
                 let tid = String(techlist[x].id);
                 let y=tid.length;
                 for(y;y<5;y++){tid='0'+tid;}//format techid
                 techreports.push({
                   month:today.getMonth(),
                   techuser:techtools.techlist[x].user,
                   techname:techtools.techlist[x].name,
                   techid:techtools.techlist[x].id,
                   data:CREATEtechreport(pack.table,tid)
                 });
               }
               STOREtechreports(techreports); //Store update tech reports => tech_reports(vapi)
               return res({update:true,msg:'Tech Reports Updated'});
             }else{return res({update:false,msg:'Failed to Load from JAPI'})}
           }
         );

       }else{return res({update:false,msg:'Already Synced Today'})}
     }
   );
  });
}

/* Clean Month
   PASS:
   - month:0-11 (january==0)

   With a given month, the tech report is cleaned
*/
var CLEANtechmonth=(month=-1)=>{
  /* wojournal
    - pull entire month from jonas
    - add to wojournal_currmonth
    - pull wojournal_currmonth
    - add to wojournal_curryear
    - clear wojournal_currmonth
  */
  return new Promise((res,rej)=>{
    if(month>=0&&month<12){
      let day = new Date();
      let fromday = datetools.getFirstDayOfMonth(day.getFullYear(),month).toISOString().split('T')[0];
      let today = datetools.getLastDayOfMonth(day.getFullYear(),month).toISOString().split('T')[0];

      japimart.GETj2vtable(
        {table:'wod',
         params:{
           fromdate:fromday,
           todate:today
         }
       }).then(
         jpack=>{
           console.log(jpack)
           if(jpack.success&&jpack.table.length>0){
             //
           }
           return res(false);
         }
       )
    }else{return res(false);}
  });
}

var STOREtechreports=(techreports=[])=>{
  return new Promise((res,rej)=>{
    let faillog = []
    let adj =0;
    for(let x=0;x<techreports.length;x++){
      adj=adj+500;
      setTimeout(()=>{ //needed to stagger vapi request
        vapistore.SENDrequest(vapiconnects[vapiapp].url,vapiapp,
        { db:'tech_reports',
          method:'query',
          options:{query:{month:techreports[x].month,techuser:techreports[x].techuser}}
        }).then(
          result=>{
            let rdata = result.data;
            if(rdata.success&&rdata.body.result.length>0){
              vapistore.SENDrequest(vapiconnects[vapiapp].url,vapiapp,
              { db:'tech_reports',
                method:'update',
                options:{
                  query:{_id:rdata.body.result[0]['_id']},
                  update:{$set:rdata.body.result[0]},
                  options:{}
                }
              }).then(
                upresult=>{console.log('UPDATED >',upresult);}
              )
            }else{
              console.log('NOT FOUND > ',result,techreports[x])
              vapistore.SENDrequest(vapiconnects[vapiapp].url,vapiapp,
              { db:'tech_reports',
                method:'insert',
                options:{docs:techreports[x]}
              }).then(
                inresult=>{console.log('INSERTED >',inresult)}
              )
            }
          }
        )
      },100+adj);
    }
  })
}

module.exports={
  UPDATEtechdb,
  UPDATEtechtracker,
  techlist,
  RUNtechwo,
  UPDATEtechmonth,
  CLEANtechmonth
}
