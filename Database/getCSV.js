import get from "./stuffGetter.js";
function getStatus(s){
 switch(s){
  case 0:return 'Disponível'
  case 1:return 'Manutenção'
  case 2:return 'Quebrado'
 }
}
async function parseData(data,secn,subn,objn){
 let str = ''
 let i = 0;
 let sn = secn??''
 let sun = subn??''
 let on = objn??''
 for(const item of data){
  switch(item.type){
   case 0:
    sn = item.name;
    str += `${sn};${item.name}`
    break;
   case 1:
    sun = item.name;
    str += `${sn};${sun};${item.name}`
    break;
   case 2:{
    on = item.name;
    str += `${sn};${sun};${on};${item.name};#;Status`
    const data = await get.categoryInfo(item.ID)
    for (const field of data.custom){
     str+=`;${field}`
    }
    str +=`;Disponível:${data.disponivel};Quebrados:${data.quebrado};Em Manutenção:${data.manutencao};Total:${data.totalItems}`
    const children = await get.objects(item.ID)
    item.children = children;
    break;
   }
   case 3:{
    i++
    str += `;;;;${i};${getStatus(item.estado)}`
    const dataArray = item.custom
    for (const field of dataArray){
     str+=`;${field}`
    }
    break;
   }
  }
  str += '\n'
  if (item.children.length>0)
   str += await parseData(item.children,sn,sun,on);
  if (item.type ==2)str+='\n'
 }
 return str;
}

export default async ()=>{
 const data = await get.all(0b1111,{});
 return await 'Setor;Subsetor;Objeto\n'+parseData(data);
}
