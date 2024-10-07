const video = document.getElementById("video");
const presenceTable = [];
let detectionInterval;
let faceVerificationCounts = {};

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("models"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

async function getLabeledFaceDescriptions() {
  const labels = ["Hamza", "Yasser", "Reda", "Zakaria"];
  return Promise.all(
    labels.map(async (label) => {
      const img = await faceapi.fetchImage(`labels/${label}/1.jpg`);
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
    })
  );
}

function verifyFace(label, confidence) {
  if (confidence < 0.5) {
    if (!faceVerificationCounts[label]) {
      faceVerificationCounts[label] = { count: 1, startTime: Date.now() };
    } else {
      faceVerificationCounts[label].count++;
      const elapsedTime = Date.now() - faceVerificationCounts[label].startTime;

      //! ------------------------------ DEBUGGING ----------------------------------------------------
      console.log("LABEL: ",label)
      console.table(presenceTable)
      if (faceVerificationCounts[label].count >= 10 && elapsedTime >= 1000 && !presenceTable.find((item) => item === label)) {

        console.log("LOGGED!")
        presenceTable.push(label)
        addToPresenceTable(label);
        
        delete faceVerificationCounts[label];
      }
    }
  } else {
    delete faceVerificationCounts[label];
  }
}

function addToPresenceTable(label) {
  const tableInd = document.getElementById('presence-table');
  
  // Create a new row
  const row = document.createElement('tr');
  
  // Create a cell for the label
  const labelCell = document.createElement('td');
  labelCell.innerText = label;
  row.appendChild(labelCell);
  
  // Create a cell for the timestamp
  const timeCell = document.createElement('td');
  const now = new Date();
  timeCell.innerText = now.toLocaleTimeString(); // You can format this as needed
  row.appendChild(timeCell);
  
  // Append the row to the table
  tableInd.appendChild(row);
}



video.addEventListener("play", async () => {
  console.log("START");
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  detectionInterval = setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    resizedDetections.forEach((detection) => {
      const result = faceMatcher.findBestMatch(detection.descriptor);
      verifyFace(result.label, result.distance);
      console.log(result.distance)
      console.log(result.label)
      
      const box = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(canvas);
    });
  }, 100);
});

video.addEventListener("pause", () => {
  clearInterval(detectionInterval);
});