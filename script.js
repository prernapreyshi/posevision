/*************************************************
 * REAL-TIME POSE DETECTION (FINAL – MIRROR FIXED)
 * MediaPipe Holistic + JavaScript
 *************************************************/

// ---------- HTML ELEMENTS ----------
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const output = document.getElementById("output");

// ---------- DEVICE CHECK ----------
const isMobile = window.innerWidth < 768;

// ---------- VOICE ----------
let lastSpoken = "";

// ---------- SPEAK ----------
function speak(text) {
  if (!text || text === lastSpoken) return;
  lastSpoken = text;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

// ---------- MEDIAPIPE ----------
const holistic = new Holistic({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
});

holistic.setOptions({
  modelComplexity: isMobile ? 0 : 1,
  smoothLandmarks: true,
});

// ---------- ANGLE ----------
function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// ---------- SMOOTHING ----------
const history = {};
function smooth(key, val) {
  if (!history[key]) history[key] = [];
  history[key].push(val);
  if (history[key].length > 5) history[key].shift();
  return history[key].reduce((a, b) => a + b, 0) / history[key].length;
}

// ---------- ACCURACY ----------
function accuracy(current, ideal) {
  return Math.max(0, Math.round(100 - Math.abs(current - ideal) * 1.5));
}

// ---------- SAVE SESSION ----------
function saveSession(pose, acc) {
  const sessions = JSON.parse(localStorage.getItem("poseSessions")) || [];
  sessions.push({
    pose,
    accuracy: acc,
    time: new Date().toLocaleString(),
  });
  localStorage.setItem("poseSessions", JSON.stringify(sessions));
}

// ---------- DRAW TEXT (NOT MIRRORED) ----------
function drawText(text, x, y) {
  ctx.save();
  ctx.scale(-1, 1); // undo mirror
  ctx.fillStyle = "white";
  ctx.font = "15px Arial";
  ctx.fillText(text, -canvas.width + x, y);
  ctx.restore();
}

// ---------- SKELETON ----------
const connections = [
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [11, 12],
  [11, 23], [12, 24],
  [23, 25], [25, 27],
  [24, 26], [26, 28],
];

function drawSkeleton(lm) {
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;
  connections.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
    ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
    ctx.stroke();
  });
}

// ---------- STABILITY ----------
let stablePose = "";
let poseCounter = 0;

// ---------- POSE LOGIC ----------
function detectPose(lm) {
  // Full body check
  if (lm[27].visibility < 0.5 || lm[28].visibility < 0.5) {
    output.innerText = "Step back – full body not visible";
    return;
  }

  const lArm = smooth("lArm", calculateAngle(lm[11], lm[13], lm[15]));
  const rArm = smooth("rArm", calculateAngle(lm[12], lm[14], lm[16]));
  const lKnee = smooth("lKnee", calculateAngle(lm[23], lm[25], lm[27]));
  const rKnee = smooth("rKnee", calculateAngle(lm[24], lm[26], lm[28]));

  // ---------- LIVE ANGLES ----------
  drawText(`Left Arm: ${lArm.toFixed(1)}°`, 15, 25);
  drawText(`Right Arm: ${rArm.toFixed(1)}°`, 15, 50);
  drawText(`Left Knee: ${lKnee.toFixed(1)}°`, 15, 75);
  drawText(`Right Knee: ${rKnee.toFixed(1)}°`, 15, 100);

  let pose = "No Pose";
  let acc = 0;
  let message = "Adjust posture";

  // T-POSE
  if (lArm > 140 && rArm > 140) {
    pose = "🧍 T-Pose";
    acc = Math.min(accuracy(lArm, 180), accuracy(rArm, 180));
    message = acc > 75 ? "Perfect T pose" : "Straighten your arms";
  }

  // WARRIOR II
  else if (
    (lKnee > 70 && lKnee < 130) ||
    (rKnee > 70 && rKnee < 130)
  ) {
    pose = "⚔️ Warrior II";
    acc = Math.max(accuracy(lKnee, 90), accuracy(rKnee, 90));
    message = acc > 75 ? "Strong warrior pose" : "Bend your front knee";
  }

  // TREE POSE
  else {
    const ankleDiff = Math.abs(lm[27].y - lm[28].y);
    if (ankleDiff > 0.12) {
      pose = "🌳 Tree Pose";
      acc = accuracy(ankleDiff * 100, 18);
      message = acc > 75 ? "Nice balance" : "Focus on balance";
    }
  }

  // Stability lock
  if (pose === stablePose) poseCounter++;
  else {
    poseCounter = 0;
    stablePose = pose;
  }

  if (poseCounter > 10) {
    output.innerText = `${pose} | Accuracy: ${acc}%`;
    drawText(`Pose: ${pose}`, 15, canvas.height - 45);
    drawText(`Accuracy: ${acc}%`, 15, canvas.height - 20);
    speak(message);
    if (acc > 80) saveSession(pose, acc);
  }
}

// ---------- FRAME LOOP ----------
holistic.onResults((results) => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    // Points
    results.poseLandmarks.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });

    drawSkeleton(results.poseLandmarks);
    detectPose(results.poseLandmarks);
  } else {
    output.innerText = "No person detected";
  }
});

// ---------- CAMERA ----------
const camera = new Camera(video, {
  onFrame: async () => {
    await holistic.send({ image: video });
  },
  width: isMobile ? 360 : 640,
  height: 480,
});

camera.start();
