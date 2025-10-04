import database from "../database.js";
import { authMiddleware, rankMiddleware } from "../server.js";
import { Router } from "express";

const router = Router();

router.get('/manutencoes',authMiddleware,rankMiddleware(4),async(req,res)=>{
 const mainarray = await database('manutencoes').where('concluido',false);

 if (mainarray.length<1)
  return res.status(200).json({ok:true,result:
  {totalObjects: 0,
   totalObjectValues: 0,
   maintenanceServices: 0,
   maintenanceObjects: {}
  }});

 const links = await database('manutencaoLinks').whereIn('manutencaoID',[...new Set(mainarray.map(m=>m.ID))])
 const linkMap = new Map();
 mainarray.forEach(m=>{
  linkMap.set(m.ID,links.filter(l=>l.manutencaoID==m.ID));
 });

 const objMap = new Map();
 for (const obj of await database('objetos').whereIn('ID',[...new Set(links.map(l=>l.objetoID))]))
 {
  objMap.set(obj.ID,obj)
 }
 
 const seenObjects = new Set();
 let objTotals = 0;
 let totalValues = 0;
 let mainCount = 0;

 const mains = [];
 mainarray.forEach(main=>{
  mainCount++;
  const mainObj = {...main,sumValue:0,objects:[]};
  mains.push(mainObj);
  linkMap.get(main.ID).forEach(l=>{
   const obj = objMap.get(l.objetoID)
   if (!obj)return;
   mainObj.sumValue+=main.valor;// add cost per object to the maintenance
   totalValues+=main.valor; // add cost per maintenance to the global
   if (!seenObjects.has(obj.ID)){
    seenObjects.add(obj.ID);
    objTotals++;
   }
   mainObj.objects.push(obj);
  });
 });
 
 return res.status(200).json({ok:true,result:
  {totalObjects: objTotals,
   totalObjectValues: totalValues,
   maintenanceServices: mainCount,
   maintenanceObjects: mains
  }});
});

router.post('/manutencoes',authMiddleware,rankMiddleware(4),async(req,res)=>{
 const {objIDs,value,data} = req.body;
 console.log(data);
 const objects = await database('objetos').whereIn('ID',objIDs);
 for (const item of objects){
  if (item.estado==1)
   return res.status(400).json({ok:false,error:'Objeto(s) já em manutenção!'})
 }
 await database.transaction(async trx=>{
  const main = (await trx('manutencoes').insert({valor:value,retornoEsperado:new Date(data),data:new Date(),tipoObjetoID:objects[0].tid}).returning('*'))[0]
  await trx('manutencaoLinks').insert(objIDs.map(o=>({objetoID:o,manutencaoID:main.ID})))
  for (const id of objIDs){
   await trx('objetos').update({estado:1}).where('ID',id);
  }
 })

 return res.status(201).json({ok:true});
});

export default router