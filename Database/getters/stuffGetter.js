import database from '../database.js';

const filters = {
 sectors:1,
 subsectors:2,
 categories:4,
}

function hasMask(num,mask){
 return (num&mask) == mask;
}

/* THIS IS GONNA GET FUNKY! */
async function getCategoryInfo(id){
 const objs = await getCategoryObjects(id)
 const th = await database('tipoObjetos').where('ID',id).first()
 const data = {totalItems:0,disponivel:0,manutencao:0,quebrado:0,custom:th.customData.split(',')}
 objs.forEach(item=>{
  data.totalItems++;
  switch(item.estado){
   case 0:data.disponivel++; break;
   case 1:data.manutencao++; break;
   case 2:data.quebrado++; break;
  }
 });
 return data
}

async function getCategoryObjects(id){
 const result = []
 const items = await database('objetos').where('tid',id);
 for (const item of items){
  const data = item.customData.split(',')
  result.push({...item,...{custom:data,type:3,children:[]}})
 }
 return result
}

async function getSubsectorChildren(id,filter,search){
 const result = []
 const items = await database('tipoObjetos').where('suid',id).andWhere((builder)=>{
  if (search.cat)
   builder.whereLike('name',`%${search.cat}%`)
 });
 if (hasMask(filter,filters.categories)){
  for (const item of items){
   result.push({...item,...{type:2,children:[]}})
  }
 }
 return result
}

async function getSectorChildren(id,filter,search){
 const result = [];
 const subs = await database('subsetores').where('sid',id).andWhere((builder)=>{
  if (search.sub)
   builder.whereLike('name',`%${search.sub}%`)
 });
 if (subs.length>0 && hasMask(filter,filters.subsectors)){
  for (const item of subs){
   const c = await getSubsectorChildren(item.ID,filter,search)
   const parent = await database('setores').where('id',id).first()
   result.push({...item,...{type:1,children:c,parent:parent.name}});
  };
  return result
 }
 
 let cats = await database('tipoObjetos').where('sid',id).andWhere((builder)=>{
  if (search.cat)
    builder.whereLike('name',`%${search.cat}%`)
  });
 for (const sub of subs)
  cats = cats.concat(await database('tipoObjetos').where('suid',sub.ID).andWhere((builder)=>{
  if (search.cat)
    builder.whereLike('name',`%${search.cat}%`)
  }))
 if (hasMask(filter,filters.categories)){//IL
  for (const item of cats){
   result.push({...item,...{type:2,children:[]}})
  }
 }
 return result
}

async function getStuff(filter,search){
 const result = []
 if (hasMask(filter,filters.sectors)){
  const items = await database('setores').where((builder)=>{
   if (search.sec)
    builder.whereLike('name',`%${search.sec}%`)
  });
  for (const item of items){
   const c = await getSectorChildren(item.ID, filter,search)
   result.push({...item,...{type:0,children:c}});
  };
 }else if (hasMask(filter,filters.subsectors)){
  const items = await database('subsetores').where((builder)=>{
   if (search.sub)
    builder.whereLike('name',`%${search.sub}%`)
  });
  for (const item of items){
   const c = await getSubsectorChildren(item.ID,filter,search)
   const parent = await database('setores').where('ID',item.sid).first()
   result.push({...item,...{type:1,children:c}})
  }
 }else if (hasMask(filter,filters.categories)){
  const items = await database('tipoObjetos').where((builder)=>{
   if (search.cat)
    builder.whereLike('name',`%${search.cat}%`)
  });
  for (const item of items){
   result.push({...item,...{type:2,children:[]}})
  }
 }
 return result
}
export default {all:getStuff,sector:getSectorChildren,sub:getSubsectorChildren,objects:getCategoryObjects,categoryInfo:getCategoryInfo}
/* WELL, THAT WAS FUNKY. */