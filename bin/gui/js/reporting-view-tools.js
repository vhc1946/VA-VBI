


var monthlist = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var daylist=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

var writeCostingTable=(obj={},title='',costing=false,summ=false)=>{
  let ele = document.createElement('div');
  ele.classList.add('report-table');
  ele.appendChild(document.createElement('div')).classList.add('report-table-row'); //summary row
  if(summ){
    ele.lastChild.appendChild(document.createElement('div')).innerText = ''
    ele.lastChild.appendChild(document.createElement('div')).innerText = obj.summary.count;
    if(costing){
      for(let c in obj.summary.costing){
        ele.lastChild.appendChild(document.createElement('div')).innerText = Math.abs(obj.summary.costing[c].toFixed(2));
      }
    }
  }
  ele.appendChild(document.createElement('div')).classList.add('report-table-row');
  ele.lastChild.appendChild(document.createElement('div')).innerText=title;
  ele.lastChild.appendChild(document.createElement('div')).innerText='Total';
  if(costing){
    ele.lastChild.appendChild(document.createElement('div')).innerText='Billed';
    ele.lastChild.appendChild(document.createElement('div')).innerText='Mat Cost';
    ele.lastChild.appendChild(document.createElement('div')).innerText='Lab Cost';
    ele.lastChild.appendChild(document.createElement('div')).innerText='Lab Hours';
  }
  for(let o in obj){
    if(o!='summary'){
      ele.appendChild(document.createElement('div')).classList.add('report-table-row');
      ele.lastChild.appendChild(document.createElement('div')).innerText = o;
      ele.lastChild.appendChild(document.createElement('div')).innerText = obj[o].count;
      if(costing){
        for(let c in obj[o].costing){
          ele.lastChild.appendChild(document.createElement('div')).innerText = Math.abs(obj[o].costing[c].toFixed(2));
        }
      }
    }
  }
  return ele;
}
var writeCounts=(obj={},title='')=>{
  let ele = document.createElement('div');
  ele.classList.add('report-count-list');
  ele.appendChild(document.createElement('div')).innerText=title;
  for(let o in obj){
    ele.appendChild(document.createElement('div'));
    ele.lastChild.innerText = o;
    ele.appendChild(document.createElement('div'));
    ele.lastChild.innerText = obj[o];
  }
  return ele
}



module.exports={
  monthlist,
  daylist,
  writeCostingTable,
  writeCounts
}
