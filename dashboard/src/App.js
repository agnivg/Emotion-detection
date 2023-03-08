import React,{useState,useEffect} from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import axios from 'axios'
import './App.css'

const App=()=>{
  const [emotions,setEmotions]=useState([])
  const [users,setUsers]=useState([])
  const [videoaudioem,setVideoaudioem]=useState(null)
  const COLORS = ["#ff3333", "#70db70", "#ffff33", "#adad85", "#ccffcc", "#ffcccc", "#ff8533"];
  const nums = [1,2,3,4,5,6,7,8];
  useEffect(()=>{
    axios({
        url:'http://localhost:5000/dashboard',
        method:'GET',
    }).then(res=>{
      setEmotions(res.data.emotions)
    }).catch(err=>{
      console.log(err)
    })
  },[])

  useEffect(()=>{
   if(emotions.length!=0){
    const list=[]
    for(let i=0;i<emotions.length;i+=2){
      list.push(emotions[i])
    }
    setUsers(list)
    setVideoaudioem({
      'name':emotions[0].name,
      'count':emotions[0].count,
      'date':emotions[0].date,
      'time':emotions[0].time,
      'angryv':emotions[0].angry,
      'sadv':emotions[0].sad,
      'happyv':emotions[0].happy,
      'fearv':emotions[0].fear,
      'surprisev':emotions[0].surprise,
      'disgustv':emotions[0].disgust,
      'neutralv':emotions[0].neutral,
      'urlv':emotions[0].url,
      'angrya':emotions[1].angry,
      'sada':emotions[1].sad,
      'happya':emotions[1].happy,
      'feara':emotions[1].fear,
      'surprisea':emotions[1].surprise,
      'disgusta':emotions[1].disgust,
      'neutrala':emotions[1].neutral,
      'urla':emotions[1].url
    })
   }
  },[emotions])

  const update=(i)=>{
    setVideoaudioem({
      'name':emotions[i].name,
      'count':emotions[i].count,
      'date':emotions[i].date,
      'time':emotions[i].time,
      'angryv':emotions[i].angry,
      'sadv':emotions[i].sad,
      'happyv':emotions[i].happy,
      'fearv':emotions[i].fear,
      'surprisev':emotions[i].surprise,
      'disgustv':emotions[i].disgust,
      'neutralv':emotions[i].neutral,
      'urlv':emotions[i].url,
      'angrya':emotions[i+1].angry,
      'sada':emotions[i+1].sad,
      'happya':emotions[i+1].happy,
      'feara':emotions[i+1].fear,
      'surprisea':emotions[i+1].surprise,
      'disgusta':emotions[i+1].disgust,
      'neutrala':emotions[i+1].neutral,
      'urla':emotions[i+1].url
    })
  }

  return (
    <>
      <div className='container'>
        <div className='left'>
          <h1 className='left-title'>Users</h1>
          {
            users && users.map((emotion,i)=>{
              return(
                <h3 className='users' onClick={()=>update(2*i)}>{emotion.name}</h3>
              )
            })
          }
        </div>
        <div className='right'>
          <h1 style={{marginBottom:"15px",color:"#ffe6e6"}}>Dashboard</h1>
          {!videoaudioem && <h2>No emotion analysis available yet</h2>}
          {videoaudioem && 
          <div className='subcontainer'>
            <div className='child1'>
              <h2 style={{color:"#9999ff"}}>Profile</h2><br/>
              Username: {videoaudioem['name']}<br/>
              Total Meetings attended: {videoaudioem['count']}<br/>
              Last Meeting: {videoaudioem['date']}<br/>
              At: {videoaudioem['time']}
            </div>
            <div className='child2'>
            <span style={{paddingLeft:"111px",color:"#ff99ff"}}>Overall Emotion Analysis from Video</span><br/>
            <PieChart width={500} height={220}>
            <Pie
              data= {[
                {
                    name: "Angry",
                    value: videoaudioem['angryv']
                },
                {
                    name: "Neutral",
                    value: videoaudioem['neutralv']
                },
                {
                    name: "Happy",
                    value: videoaudioem['happyv']
                },
                {
                    name: "Sad",
                    value: videoaudioem['sadv']
                },
                {
                    name: "Disgust",
                    value: videoaudioem['disgustv']
                },
                {
                  name: "Fear",
                  value: videoaudioem['fearv']
                },
                {
                  name: "Surprise",
                  value: videoaudioem['surprisev']
                }
              ]}
              outerRadius={76}
            >
            {nums.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % 8]}
                />
            ))}
            </Pie>
            <Legend />
            </PieChart>
            </div> 
            <div className='child3'>
            <span style={{paddingLeft:"57px",color:"#ff99ff"}}>Overall Emotion Analysis from Audio</span><br/>
              <PieChart width={400} height={220}>
            <Pie
              data= {[
                {
                    name: "Angry",
                    value: videoaudioem['angrya']
                },
                {
                    name: "Neutral",
                    value: videoaudioem['neutrala']
                },
                {
                    name: "Happy",
                    value: videoaudioem['happya']
                },
                {
                    name: "Sad",
                    value: videoaudioem['sada']
                },
                {
                    name: "Disgust",
                    value: videoaudioem['disgusta']
                },
                {
                  name: "Fear",
                  value: videoaudioem['feara']
                },
                {
                  name: "Surprise",
                  value: videoaudioem['surprisea']
                }
              ]}
              outerRadius={76}
            >
            {nums.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % 8]}
                />
            ))}
            </Pie>
            <Legend />
            </PieChart>
            </div>            
          </div>
          }
          {videoaudioem && <div><img src={videoaudioem['urlv']}/><img src={videoaudioem['urla']}/></div>}
        </div>
      </div>
    </>          
  )
}

export default App;