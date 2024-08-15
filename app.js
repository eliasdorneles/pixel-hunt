// Get references to HTML elements
const appDiv = document.getElementById("app");
let currentColorElement = null;
let zoomPixelGrid = null;
let imageContainer = null;
let messageContainer = null;
let scoreElement = null;

// images database
const IMAGES = [
  "./assets/img/ice-cream-cart-on-beach-vector-clipart_800.png",
  "./assets/img/mallard-duck-standing-on-shore_800.jpg",
  "./assets/img/giant-water-bug-on-rocks_800.jpg",
  "./assets/img/people-on-tel-aviv-beach-israel_800.jpg",
  "./assets/img/skyline-with-towers-and-sky-in-tel-aviv-israel_800.jpg",
  "./assets/img/robin-extreme-close-up_800.jpg",
  "./assets/img/construction-on-lake-wisconsin_800.jpg",
  "./assets/img/skyline-of-the-cityscape-with-storm-brewing-in-tel-aviv-israel_800.jpg",
  "./assets/img/dusk-and-sky-on-the-shoreline-in-tel-aviv-israel_800.jpg",
];

// Game state:
let targetPixel = { x: 0, y: 0 };
let won = false;

let currentImagePath = IMAGES[Math.floor(Math.random() * IMAGES.length)];

let currentImage = null;
let currentImageContext = null;

// Function to create an image element and load the image
function loadImage(imagePath) {
  currentImage = new Image();
  currentImage.id = "image";
  currentImage.src = imagePath;
  currentImage.onload = () => {
    // Call the function to choose a random target pixel
    chooseRandomTargetPixel(currentImage);
    console.log("Target Pixel:", targetPixel);
  };
  imageContainer.appendChild(currentImage);
}

function getRGBCode(pixelData) {
  return `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
}

function isDarkColor(pixelData) {
  const brightness = (pixelData[0] + pixelData[1] + pixelData[2]) / 3;
  return brightness < 100;
}

function setBgColor(element, pixelData) {
  element.style.backgroundColor = getRGBCode(pixelData);

  // needed to ensure the div will show up
  if (element.innerHTML === "") {
    element.innerHTML = "&nbsp;";
  }
}

function getTargetPixelData() {
  return currentImageContext.getImageData(targetPixel.x, targetPixel.y, 1, 1)
    .data;
}

function addNotification(message, level = "info") {
  // Create a notification element
  const notification = document.createElement("div");
  notification.classList.add("notification", `notification-${level}`);
  notification.textContent = message;

  // Append the notification to the container
  messageContainer.appendChild(notification);

  // Automatically remove the notification after 2 seconds
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// Function to choose a random target pixel and display its color
function chooseRandomTargetPixel(img) {
  addNotification(`Loaded image with dimensions: ${img.width}x${img.height}`);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  currentImageContext = canvas.getContext("2d");
  currentImageContext.drawImage(img, 0, 0);

  // Get a random x and y coordinate within the image
  const x = Math.floor(Math.random() * img.width);
  const y = Math.floor(Math.random() * img.height);

  // Store the target coordinates for later use
  targetPixel = { x, y };
  won = false;

  // Display the color in the currentColor element
  setBgColor(currentColorElement, getTargetPixelData());
}

function calcEuclideanDistance(color1, color2) {
  // Ensure both colors have the same length (RGB)
  if (color1.length !== color2.length) {
    throw new Error("Color arrays must have the same length.");
  }

  // Calculate the squared differences for each component
  let sumSquaredDifferences = 0;
  for (let i = 0; i < color1.length; i++) {
    sumSquaredDifferences += Math.pow(color1[i] - color2[i], 2);
  }

  // Calculate the square root of the sum
  return Math.sqrt(sumSquaredDifferences);
}

function calculateScore(currentPixelData) {
  const targetPixelData = currentImageContext.getImageData(
    targetPixel.x,
    targetPixel.y,
    1,
    1
  ).data;
  // let's normalize the distance
  const dist = deltaE(rgb2lab(currentPixelData), rgb2lab(targetPixelData));

  // Determine a maximum acceptable Delta E value (e.g., 1)
  const maxDeltaE = 100;

  // Normalize the Delta E value to a range of 0 to 1
  const normalizedDeltaE = Math.min(dist / maxDeltaE, 1);

  // Convert the normalized value to a score between 0 and 100
  const score = (1 - normalizedDeltaE) * 100;

  return Math.floor(score);
}

// Function to display a 3x3 grid of pixels around the mouse cursor
function showZoomPixelGrid(event) {
  if (won) {
    return;
  }
  const appDivRect = currentImage.getBoundingClientRect();

  const mouseX = event.clientX - appDivRect.left;
  const mouseY = event.clientY - appDivRect.top;

  // Clear the zoomPixelGrid div before displaying new data
  zoomPixelGrid.innerHTML = "";

  // Define the grid size (3x3)
  const gridSize = 3;

  // Loop through each pixel in grid around the mouse cursor
  const startIdx = -1;
  const endIdx = 1;
  for (let y = startIdx; y <= endIdx; y++) {
    for (let x = startIdx; x <= endIdx; x++) {
      // Calculate the pixel coordinates within the image
      const imageX = Math.floor(mouseX + x);
      const imageY = Math.floor(mouseY + y);

      // Ensure the pixel coordinates are within image boundaries
      if (
        imageX >= 0 &&
        imageX < currentImage.width &&
        imageY >= 0 &&
        imageY < currentImage.height
      ) {
        // Get the color data for the current pixel
        const pixelData = currentImageContext.getImageData(
          imageX,
          imageY,
          1,
          1
        ).data;
        const pixelClass = isDarkColor(pixelData) ? "dark" : "light";

        // Create a new element to represent the pixel in the grid
        const pixelElement = document.createElement("div");
        setBgColor(pixelElement, pixelData);
        pixelElement.classList.add(pixelClass);

        // Append the pixel element to the zoomPixelGrid div
        zoomPixelGrid.appendChild(pixelElement);
      } else {
        // Handle pixels outside the image boundary
        const emptyPixelElement = document.createElement("div");
        zoomPixelGrid.appendChild(emptyPixelElement);
      }
    }
  }
  const hoveredPixelData = currentImageContext.getImageData(
    mouseX,
    mouseY,
    1,
    1
  ).data;
  const score = calculateScore(hoveredPixelData);
  displayScore(score);
}

function displayScore(score) {
  // TODO: instead of writing the score, we'd better display a slider or a
  // color bar that displays the score in a more visual way,
  // and the actual game score to be a global that counts points every time
  // the user gets a score above 96
  scoreElement.textContent = `Score: ${score}`;
  if (score > 96) {
    scoreElement.textContent = `Score: ${score} -- You won!!!`;
    scoreElement.style.color = "blue";
    won = true;
    addNotification("Congratulations!", "success");
  } else if (score < 96 && score >= 90) {
    scoreElement.style.color = "darkgreen";
  } else if (score < 90 && score >= 70) {
    scoreElement.style.color = "darkorange";
  } else {
    scoreElement.style.color = "darkred";
  }
}

function createGameElements() {
  appDiv.innerHTML = "";

  // Create a div to display the current color
  currentColorElement = document.createElement("div");
  currentColorElement.id = "current-color";
  appDiv.appendChild(currentColorElement);

  // Create a div for the zoom pixel grid
  zoomPixelGrid = document.createElement("div");
  zoomPixelGrid.id = "zoom-pixel-grid";
  appDiv.appendChild(zoomPixelGrid);

  const newColorButton = document.createElement("button");
  newColorButton.textContent = "New Color";
  newColorButton.addEventListener("click", () => {
    chooseRandomTargetPixel(currentImage);
  });
  appDiv.appendChild(newColorButton);

  const newImageButton = document.createElement("button");
  newImageButton.textContent = "New Image";
  newImageButton.addEventListener("click", () => {
    initGame();
  });
  appDiv.appendChild(newImageButton);

  // Create a message container
  messageContainer = document.createElement("div");
  messageContainer.id = "message-container";
  appDiv.appendChild(messageContainer);

  // Create a score element
  scoreElement = document.createElement("div");
  scoreElement.id = "score";
  scoreElement.textContent = "Score: 0";
  appDiv.appendChild(scoreElement);

  // Create a container for the image
  imageContainer = document.createElement("div");
  imageContainer.id = "image-container";
  appDiv.appendChild(imageContainer);
}

function initGame() {
  // Create the game elements
  createGameElements();

  // Choose a new random image
  currentImagePath = IMAGES[Math.floor(Math.random() * IMAGES.length)];

  // Initial load of the image
  loadImage(currentImagePath);

  // Event listener for mouseover on the app div
  appDiv.addEventListener("mousemove", showZoomPixelGrid);
  won = false;
}

initGame();
