//#1
let client = AgoraRTC.createClient({mode:'rtc', codec:"vp8"})

//#2
let config = {
    appid:'687243f4adc34d2f9a899777f37eca90',
    token:'007eJxTYOjbP0F+rdrcsKNcJxs5K1wMr3t8W/jEJcjQ/uT8iJ/1J+IUGMwszI1MjNNMElOSjU1SjNIsEy0sLc3NzdOMzVOTEy0NruwRSGkIZGR4v/E1AyMUgvhsDInpeZll6QwMAKtcIXc=',
    uid:null,
    channel:'agnivg',
}

//#3 - Setting tracks for when user joins
let localTracks = {
    audioTrack:null,
    videoTrack:null
}

//#4 - Want to hold state for users audio and video so user can mute and hide
let localTrackState = {
    audioTrackMuted:false,
    videoTrackMuted:false
}

function myFunction() {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar");
    
    // Add the "show" class to DIV
    x.className = "show";
    
    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

//#5 - Set remote tracks to store other users
let remoteTracks = {}

   
document.getElementById('join-btn').addEventListener('click', async () => {
    config.uid = document.getElementById('username').value
    await joinStreams()
    document.getElementById('join-wrapper').style.display = 'none'
    document.getElementById('footer').style.display = 'flex'
    startCapture()
    startCaptureAudio()
})

document.getElementById('mic-btn').addEventListener('click', async () => {
    //Check if what the state of muted currently is
    //Disable button
    if(!localTrackState.audioTrackMuted){
        //Mute your audio
        await localTracks.audioTrack.setMuted(true);
        localTrackState.audioTrackMuted = true
        document.getElementById('mic-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
        if(audioRecorder != null) {
            if(audioRecorder.state == "recording") {
                audioRecorder.pause();
            }
        }
    }else{
        await localTracks.audioTrack.setMuted(false)
        localTrackState.audioTrackMuted = false
        document.getElementById('mic-btn').style.backgroundColor ='#1f1f1f8e'
        if(audioRecorder != null) {
            if(audioRecorder.state == "paused") {
                audioRecorder.resume();
            }
        }
    }

})



document.getElementById('camera-btn').addEventListener('click', async () => {
    //Check if what the state of muted currently is
    //Disable button
    if(!localTrackState.videoTrackMuted){
        //Mute your video
        await localTracks.videoTrack.setMuted(true);
        localTrackState.videoTrackMuted = true
        document.getElementById('camera-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
        if(mediaRecorder != null) {
            if(mediaRecorder.state == "recording") {
                mediaRecorder.pause();
            }
        }
    }else{
        await localTracks.videoTrack.setMuted(false)
        localTrackState.videoTrackMuted = false
        document.getElementById('camera-btn').style.backgroundColor ='#1f1f1f8e'
        if(mediaRecorder != null) {
            if(mediaRecorder.state == "paused") {
                mediaRecorder.resume();
            }
        }
    }

})



document.getElementById('leave-btn').addEventListener('click', async () => {
    //Loop threw local tracks and stop them so unpublish event gets triggered, then set to undefined
    //Hide footer
    for (trackName in localTracks){
        let track = localTracks[trackName]
        if(track){
            track.stop()
            track.close()
            localTracks[trackName] = null
        }
    }

    //Leave the channel
    await client.leave()
    document.getElementById('footer').style.display = 'none'
    document.getElementById('user-streams').innerHTML = ''
    document.getElementById('join-wrapper').style.display = 'flex'
    stopCapture()
    stopCaptureAudio()
})




//Method will take all my info and set user stream in frame
let joinStreams = async () => {
    //Is this place hear strategicly or can I add to end of method?
    
    client.on("user-published", handleUserJoined);
    client.on("user-left", handleUserLeft);


    client.enableAudioVolumeIndicator(); // Triggers the "volume-indicator" callback event every two seconds.
    client.on("volume-indicator", function(evt){
        for (let i = 0; evt.length > i; i++){
            let speaker = evt[i].uid
            let volume = evt[i].level
            if(volume > 0){
                document.getElementById(`volume-${speaker}`).src = './assets/volume-on.svg'
            }else{
                document.getElementById(`volume-${speaker}`).src = './assets/volume-off.svg'
            }
            
        
            
        }
    });

    //#6 - Set and get back tracks for local user
    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await  Promise.all([
        client.join(config.appid, config.channel, config.token ||null, config.uid ||null),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()

    ])
    
    //#7 - Create player and add it to player list
    let player = `<div class="video-containers" id="video-wrapper-${config.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${config.uid}" src="./assets/volume-on.svg" /> ${config.uid}</p>
                        <div class="video-player player" id="stream-${config.uid}"></div>
                    </div>`

    document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
    //#8 - Player user stream in div
    localTracks.videoTrack.play(`stream-${config.uid}`)
    

    //#9 Add user to user list of names/ids

    //#10 - Publish my local video tracks to entire channel so everyone can see it
    await client.publish([localTracks.audioTrack, localTracks.videoTrack])

}


let handleUserJoined = async (user, mediaType) => {
    console.log('Handle user joined')

    //#11 - Add user to list of remote users
    remoteTracks[user.uid] = user

    //#12 Subscribe ro remote users
    await client.subscribe(user, mediaType)
    
    
    if (mediaType === 'video'){
        let player = document.getElementById(`video-wrapper-${user.uid}`)
        console.log('player:', player)
        if (player != null){
            player.remove()
        }
    
        player = `<div class="video-containers" id="video-wrapper-${user.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${user.uid}" src="./assets/volume-on.svg" /> ${user.uid}</p>
                        <div  class="video-player player" id="stream-${user.uid}"></div>
                        </div>`
        document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
            user.videoTrack.play(`stream-${user.uid}`)

        

            
    }
    

    if (mediaType === 'audio') {
        user.audioTrack.play();
        }
}


let handleUserLeft = (user) => {
    console.log('Handle user left!')
    //Remove from remote users and remove users video wrapper
    delete remoteTracks[user.uid]
    document.getElementById(`video-wrapper-${user.uid}`).remove()
}

const ROI_X = 250;
const ROI_Y = 150;
const ROI_WIDTH = 750;
const ROI_HEIGHT = 750;

const FPS = 10;

let cameraStream = null;
let processingStream = null;
let mediaRecorder = null;
let audioRecorder = null;
let audioChunks = null;
let mediaChunks = null;
let processingPreviewIntervalId = null;

function processFrame() {
    let cameraPreview = document.getElementById("cameraPreview");
    
    processingPreview
        .getContext('2d')
        .drawImage(cameraPreview, 0, 0, 1000, 1000, 0, 0, ROI_WIDTH, ROI_HEIGHT);
}

async function generateRecordingPreview() {
    let mediaBlob = new Blob(mediaChunks, { type: "video/mp4" });
    let mediaBlobUrl = URL.createObjectURL(mediaBlob);
    const name=document.getElementById('username').value;
    let newFile = new File([mediaBlob], `${name}_RecordedVideo.mp4`, {
        type: "video/mp4",
    });
    const formData = new FormData()
    formData.append('video-file', newFile)
    formData.append('name',name)
    const maxRequestSize=2 * 1024 * 1024 * 1024
    fetch('http://localhost:5000/', {
        method: 'POST',
        headers: {
            'Content-Length': maxRequestSize.toString(),
        },
        body: formData
    }).then((response)=>response.json()).then((data)=>console.log(data)).catch((err)=>console.log(err))
    
    // let a=document.createElement('a')
    // a.href = mediaBlobUrl
    // a.download = "RecordedVideo.mp4"
    // document.body.appendChild(a)
    // a.click()
    // document.body.removeChild(a)
    // const res=fetch(`http://localhost:5000?name=${name}`)
    myFunction()
}

function startCapture() {
    navigator.mediaDevices.getUserMedia({video: true})
    .then((stream) => {
        cameraStream = stream;
        
        let processingPreview = document.getElementById("processingPreview");
        processingStream = processingPreview.captureStream(FPS);
        
        mediaRecorder = new MediaRecorder(processingStream);
        mediaChunks = []
        
        mediaRecorder.ondataavailable = function(event) {
            mediaChunks.push(event.data);
            if(mediaRecorder.state == "inactive") {
                generateRecordingPreview();
            }
        };
        
        mediaRecorder.start();
        
        let cameraPreview = document.getElementById("cameraPreview");
        cameraPreview.srcObject = stream;
        processingPreviewIntervalId = setInterval(processFrame, 1000 / FPS);
    })
    .catch((err) => {
        alert("No video device found!");
    });
};

function stopCapture() {
    if(cameraStream != null) {
        cameraStream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
    
    if(processingStream != null) {
        processingStream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
    
    if(mediaRecorder != null) {
        if(mediaRecorder.state == "recording" || mediaRecorder.state == "paused") {
            mediaRecorder.stop();
        }
    }
    
    if(processingPreviewIntervalId != null) {
        clearInterval(processingPreviewIntervalId);
        processingPreviewIntervalId = null;
    }
};

async function generateRecordingPreviewAudio(){
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const name=document.getElementById('username').value;
    console.log('audio'+name)
    let newFile = new File([audioBlob], `${name}_RecordedAudio.wav`, {
        type: "audio/wav",
    });
    const formData = new FormData()
    formData.append('audio-file', newFile)
    formData.append('name',name)
    const maxRequestSize=2 * 1024 * 1024 * 1024
    const response=fetch('http://localhost:5000/audio', {
        method: 'POST',
        headers: {
            'Content-Length': maxRequestSize.toString(),
        },
        body: formData
    });
    // let a=document.createElement('a')
    // a.href = audioUrl
    // a.download = `RecordedAudio.wav`
    // document.body.appendChild(a)
    // a.click()
    // document.body.removeChild(a)
}

function startCaptureAudio(){
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
    audioRecorder = new MediaRecorder(stream);
    audioRecorder.start();

    audioChunks = [];
    audioRecorder.ondataavailable = function(event) {
        audioChunks.push(event.data);
        if(audioRecorder.state == "inactive") {
            generateRecordingPreviewAudio();
        }
    };
    }).catch((err) => {
    alert("No audio device found!");
});
}

function stopCaptureAudio(){
    if(audioRecorder != null) {
        if(audioRecorder.state == "recording" || audioRecorder.state == "paused") {
            audioRecorder.stop();
        }
    }
}



