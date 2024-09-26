

const tableHTML = document.querySelector('table');

const AppendHTML = function (a) {
    let tr = document.createElement('tr')
    tr.innerHTML = `<td>${a}</td>`;
    tableHTML.appendChild(tr)
}

const presenceArray = [];
let DetectedTime = 0;  // Tracks how long Yasser Dalali has been detected
const detectionThreshold = 7; // 3 seconds in milliseconds
let soundPlayed = false;  // To ensure sound is only played once

const sound = new Audio('success-48018.mp3'); // Replace with the path to your sound file
sound.volume = 1;
const sound2 = new Audio('short-beep-tone-47916.mp3'); // Replace with the path to your sound file
sound2.volume = 0.2;

const run = async () => {
  // loading the models is going to use await
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  const videoFeedEl = document.getElementById('video-feed');
  videoFeedEl.srcObject = stream;

  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.ageGenderNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models'),
  ]);

  const canvas = document.getElementById('canvas');
  canvas.style.left = videoFeedEl.offsetLeft;
  canvas.style.top = videoFeedEl.offsetTop;
  canvas.height = videoFeedEl.height;
  canvas.width = videoFeedEl.width;

  ///// FACIAL RECOGNITION DATA
  const refFace = await faceapi.fetchImage('https://media.licdn.com/dms/image/v2/D4E03AQHhiSrkEDUPyA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1725574752264?e=2147483647&v=beta&t=H--onh5EmpQxkd0L-JW_CZLNERfh6QpGAjC6fDoefVE');
  let refFaceAiData = await faceapi.detectAllFaces(refFace).withFaceLandmarks().withFaceDescriptors();
  let faceMatcher = new faceapi.FaceMatcher(refFaceAiData);

  setInterval(async () => {
    let faceAIData = await faceapi.detectAllFaces(videoFeedEl).withFaceLandmarks().withFaceDescriptors().withAgeAndGender().withFaceExpressions();

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceAIData = faceapi.resizeResults(faceAIData, videoFeedEl);
    faceapi.draw.drawDetections(canvas, faceAIData);
    /* faceapi.draw.drawFaceLandmarks(canvas, faceAIData); */
    faceapi.draw.drawFaceExpressions(canvas, faceAIData);


    faceAIData.forEach(face => {
      const { age, gender, genderProbability, detection, descriptor } = face;
      const genderText = `${gender} - ${Math.round(genderProbability * 100) / 100 * 100}`;
      const ageText = `${Math.round(age)} years`;

      const textField = new faceapi.draw.DrawTextField([/* genderText, ageText */], face.detection.box.topRight);
      textField.draw(canvas);


      let label = faceMatcher.findBestMatch(descriptor).toString()
      let options = {label: "Yasser Dalali"}

      // Check if the detected face matches "Yasser Dalali"

    if (label.includes('unknown')) {
        options = {label: "Unknown subject..."}
    }

    if (label.includes('person') && !presenceArray.includes('YASSERDALALI')){
        console.log("iterated over yasser's face")
      DetectedTime += 1; // Increment detection time by 200ms
        sound2.play();


      // Check if detected for more than 3 seconds (3000ms)
      if (DetectedTime >= detectionThreshold && presenceArray.includes('YASSERDALALI') === false) {
        sound.play();  // Play the sound
        presenceArray.push('YASSERDALALI');  // Add to the presence array
        console.log('Yasser Dalali detected for 3 seconds. Added to presence array.');
        AppendHTML("YASSER DALALI");
        
      }
    } else {
      DetectedTime = 0;  // Reset the counter if Yasser is not detected
    }

      const drawBox = new faceapi.draw.DrawBox(detection.box, options);
      drawBox.draw(canvas);
    });



  }, 200);
};

run();
