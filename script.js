document.addEventListener('DOMContentLoaded', function() {
    // Test configuration
    const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
    const colorWords = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];
    const itemCount = 50; // Number of items per test
    
    // Speech recognition variables
    let recognition = null;
    let speechSupported = false;
    let micPermissionGranted = false;
    let expectedResponses = [];
    let recognizedResponses = [];
    let currentTestType = '';
    
    // Accuracy tracking
    let wordReadingAccuracy = 0;
    let colorNamingAccuracy = 0;
    let incongruentAccuracy = 0;
    
    // Timer variables
    let startTime, endTime;
    let isTimerRunning = false;
    let wordReadingTime, colorNamingTime, incongruentTime;
    
    // Check browser support for Speech Recognition
    checkSpeechRecognitionSupport();
    
    // DOM Elements
    const screens = {
        intro: document.getElementById('intro-screen'),
        wordReadingInstructions: document.getElementById('word-reading-instructions'),
        wordReadingTest: document.getElementById('word-reading-test'),
        colorNamingInstructions: document.getElementById('color-naming-instructions'),
        colorNamingTest: document.getElementById('color-naming-test'),
        incongruentInstructions: document.getElementById('incongruent-instructions'),
        incongruentTest: document.getElementById('incongruent-test'),
        results: document.getElementById('results-screen')
    };
    
    // Button event listeners
    document.getElementById('start-test').addEventListener('click', startWordReadingInstructions);
    document.getElementById('start-word-reading').addEventListener('click', startWordReadingTest);
    document.getElementById('start-color-naming').addEventListener('click', startColorNamingTest);
    document.getElementById('start-incongruent').addEventListener('click', startIncongruentTest);
    document.getElementById('restart-test').addEventListener('click', restartTest);
    document.getElementById('mic-permission-btn').addEventListener('click', requestMicrophonePermission);
    
    if (document.getElementById('complete-calibration')) {
        document.getElementById('complete-calibration').addEventListener('click', completeCalibration);
    }
    
    // Key event listeners for timing
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            if (isCurrentScreen(screens.wordReadingTest)) {
                handleSpacebarPress('word-reading-timer', 'word-reading');
            } else if (isCurrentScreen(screens.colorNamingTest)) {
                handleSpacebarPress('color-naming-timer', 'color-naming');
            } else if (isCurrentScreen(screens.incongruentTest)) {
                handleSpacebarPress('incongruent-timer', 'incongruent');
            }
        }
    });
    
    // Check if Speech Recognition is supported
    function checkSpeechRecognitionSupport() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            speechSupported = true;
            initializeSpeechRecognition();
        } else {
            speechSupported = false;
            document.getElementById('browser-warning').classList.remove('hidden');
        }
    }
    
    // Initialize Speech Recognition
    function initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            updateMicrophoneStatus(currentTestType, 'active', 'Listening...');
        };
        
        recognition.onend = function() {
            // Only restart if timer is still running
            if (isTimerRunning && speechSupported && micPermissionGranted) {
                recognition.start();
            } else {
                updateMicrophoneStatus(currentTestType, 'inactive', 'Microphone off');
            }
        };
        
        recognition.onresult = function(event) {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.trim().toUpperCase();
            
            // Update the recognized text display
            if (currentTestType) {
                document.getElementById(`${currentTestType}-recognized`).textContent = transcript;
                
                // Handle calibration mode specially
                if (currentTestType === 'calibration') {
                    document.getElementById('calibration-recognized').textContent = transcript;
                    const colorWords = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];
                    
                    // Check if at least one color word is recognized
                    const recognizedAny = colorWords.some(color => transcript.includes(color));
                    document.getElementById('complete-calibration').disabled = !recognizedAny;
                    return;
                }
                
                // Process the recognized words
                const words = transcript.split(' ').filter(word => word.length > 0);
                
                // Add new recognized words to our list
                for (let i = recognizedResponses.length; i < words.length && i < expectedResponses.length; i++) {
                    recognizedResponses.push(words[i]);
                }
                
                // Calculate and update accuracy
                updateAccuracy();
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                micPermissionGranted = false;
                updateMicrophoneStatus('', 'inactive', 'Permission denied');
            }
        };
    }
    
    // Request microphone permission
    function requestMicrophonePermission() {
        if (!speechSupported) {
            alert('Speech recognition is not supported in this browser. Try using Google Chrome.');
            return;
        }
        
        updateMicrophoneStatus('', 'pending', 'Requesting permission...');
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                micPermissionGranted = true;
                updateMicrophoneStatus('', 'active', 'Microphone access granted');
                
                // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
                
                // Start calibration
                currentTestType = 'calibration';
                recognition.start();
            })
            .catch(function(err) {
                micPermissionGranted = false;
                updateMicrophoneStatus('', 'inactive', 'Permission denied');
                console.error('Error accessing microphone:', err);
            });
    }
    
    function completeCalibration() {
        recognition.stop();
        currentTestType = '';
    }
    
    // Update microphone status display
    function updateMicrophoneStatus(testType, status, text) {
        const iconId = testType ? `${testType}-mic-icon` : 'mic-icon';
        const statusId = testType ? `${testType}-mic-status` : 'mic-status-text';
        
        const iconElement = document.getElementById(iconId);
        const statusElement = document.getElementById(statusId);
        
        if (iconElement && statusElement) {
            // Remove all status classes
            iconElement.classList.remove('mic-active', 'mic-inactive', 'mic-pending');
            
            // Add appropriate status class
            iconElement.classList.add(`mic-${status}`);
            statusElement.textContent = text;
        }
    }
    
    function startWordReadingInstructions() {
        if (speechSupported && !micPermissionGranted) {
            alert('Please grant microphone access to continue with the test.');
            requestMicrophonePermission();
            return;
        }
        
        hideAllScreens();
        screens.wordReadingInstructions.classList.remove('hidden');
    }
    
    function startWordReadingTest() {
        hideAllScreens();
        screens.wordReadingTest.classList.remove('hidden');
        
        // Generate word reading test items
        const container = document.getElementById('word-reading-container');
        container.innerHTML = '';
        expectedResponses = [];
        recognizedResponses = [];
        
        for (let i = 0; i < itemCount; i++) {
            const randomWordIndex = Math.floor(Math.random() * colorWords.length);
            const word = document.createElement('span');
            word.className = 'color-word black';
            word.textContent = colorWords[randomWordIndex];
            container.appendChild(word);
            
            // Store the expected response (the word itself for word reading)
            expectedResponses.push(colorWords[randomWordIndex]);
        }
        
        // Reset and prepare for this test
        currentTestType = 'word-reading';
        updateMicrophoneStatus(currentTestType, 'inactive', 'Ready (press spacebar to start)');
    }
    
    function startColorNamingInstructions() {
        hideAllScreens();
        screens.colorNamingInstructions.classList.remove('hidden');
    }
    
    function startColorNamingTest() {
        hideAllScreens();
        screens.colorNamingTest.classList.remove('hidden');
        
        // Generate color blocks
        const container = document.getElementById('color-naming-container');
        container.innerHTML = '';
        expectedResponses = [];
        recognizedResponses = [];
        
        for (let i = 0; i < itemCount; i++) {
            const randomColorIndex = Math.floor(Math.random() * colors.length);
            const colorBlock = document.createElement('div');
            colorBlock.className = 'color-block';
            colorBlock.style.backgroundColor = colors[randomColorIndex];
            container.appendChild(colorBlock);
            
            // Store the expected response (color name)
            expectedResponses.push(colorWords[randomColorIndex]);
        }
        
        // Reset and prepare for this test
        currentTestType = 'color-naming';
        updateMicrophoneStatus(currentTestType, 'inactive', 'Ready (press spacebar to start)');
    }
    
    function startIncongruentInstructions() {
        hideAllScreens();
        screens.incongruentInstructions.classList.remove('hidden');
    }
    
    function startIncongruentTest() {
        hideAllScreens();
        screens.incongruentTest.classList.remove('hidden');
        
        // Generate incongruent color-word items
        const container = document.getElementById('incongruent-container');
        container.innerHTML = '';
        expectedResponses = [];
        recognizedResponses = [];
        
        for (let i = 0; i < itemCount; i++) {
            // Get random word and color ensuring they're different
            let wordIndex = Math.floor(Math.random() * colorWords.length);
            let colorIndex;
            do {
                colorIndex = Math.floor(Math.random() * colors.length);
            } while (wordIndex === colorIndex); // Ensure color and word are incongruent
            
            const word = document.createElement('span');
            word.className = `color-word ${colors[colorIndex]}`;
            word.textContent = colorWords[wordIndex];
            container.appendChild(word);
            
            // Store the expected response (color name, not word)
            expectedResponses.push(colorWords[colorIndex]);
        }
        
        // Reset and prepare for this test
        currentTestType = 'incongruent';
        updateMicrophoneStatus(currentTestType, 'inactive', 'Ready (press spacebar to start)');
    }
    
    function showResults() {
        hideAllScreens();
        screens.results.classList.remove('hidden');
        
        // Display timing results
        document.getElementById('word-reading-time').textContent = formatTime(wordReadingTime);
        document.getElementById('color-naming-time').textContent = formatTime(colorNamingTime);
        document.getElementById('incongruent-time').textContent = formatTime(incongruentTime);
        
        // Display accuracy results
        document.getElementById('word-reading-result-accuracy').textContent = `${wordReadingAccuracy}%`;
        document.getElementById('color-naming-result-accuracy').textContent = `${colorNamingAccuracy}%`;
        document.getElementById('incongruent-result-accuracy').textContent = `${incongruentAccuracy}%`;
        
        // Calculate interference scores
        const differenceScore = (incongruentTime - colorNamingTime).toFixed(2);
        const ratioScore = (incongruentTime / colorNamingTime).toFixed(2);
        
        document.getElementById('difference-score').textContent = differenceScore;
        document.getElementById('ratio-score').textContent = ratioScore;
        
        // Generate time-based interpretation
        const interpretationText = document.getElementById('interpretation-text');
        
        if (parseFloat(ratioScore) > 2) {
            interpretationText.textContent = 'Your results show a strong Stroop effect, indicating significant interference when naming colors of incongruent words. This is normal and demonstrates the automatic nature of reading.';
        } else if (parseFloat(ratioScore) > 1.5) {
            interpretationText.textContent = 'Your results show a moderate Stroop effect, indicating the expected level of interference when naming colors of incongruent words.';
        } else {
            interpretationText.textContent = 'Your results show a mild Stroop effect. This might indicate good cognitive inhibition skills or practice with the Stroop task.';
        }
        
        // Generate accuracy-based interpretation
        const accuracyInterpretation = document.getElementById('accuracy-interpretation');
        
        if (incongruentAccuracy < colorNamingAccuracy - 15) {
            accuracyInterpretation.textContent = `Your accuracy in the incongruent condition (${incongruentAccuracy}%) was significantly lower than in the color naming condition (${colorNamingAccuracy}%), which is another indicator of the Stroop effect.`;
        } else if (incongruentAccuracy < colorNamingAccuracy - 5) {
            accuracyInterpretation.textContent = `Your accuracy in the incongruent condition (${incongruentAccuracy}%) was moderately lower than in the color naming condition (${colorNamingAccuracy}%), showing some impact of the Stroop effect on accuracy.`;
        } else {
            accuracyInterpretation.textContent = `Your accuracy remained relatively stable across conditions, suggesting good maintenance of performance despite the difficulty of the incongruent task.`;
        }
    }
    
    function handleSpacebarPress(timerId, testType) {
        if (!isTimerRunning) {
            // Start timer and speech recognition
            startTime = new Date();
            isTimerRunning = true;
            updateTimer(timerId);
            
            // Start speech recognition if supported and permitted
            if (speechSupported && micPermissionGranted) {
                recognizedResponses = []; // Reset recognized responses
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Recognition already started', e);
                }
            }
        } else {
            // Stop timer
            endTime = new Date();
            isTimerRunning = false;
            const duration = (endTime - startTime) / 1000; // Convert to seconds
            
            // Stop speech recognition
            if (recognition) {
                recognition.stop();
            }
            
            // Calculate final accuracy for this test
            const accuracy = calculateAccuracy();
            
            // Store the time and accuracy based on current test
            if (testType === 'word-reading') {
                wordReadingTime = duration;
                wordReadingAccuracy = accuracy;
                startColorNamingInstructions();
            } else if (testType === 'color-naming') {
                colorNamingTime = duration;
                colorNamingAccuracy = accuracy;
                startIncongruentInstructions();
            } else if (testType === 'incongruent') {
                incongruentTime = duration;
                incongruentAccuracy = accuracy;
                showResults();
            }
        }
    }
    
    function updateAccuracy() {
        const accuracy = calculateAccuracy();
        if (currentTestType) {
            document.getElementById(`${currentTestType}-accuracy`).textContent = `${accuracy}%`;
        }
    }
    
    function calculateAccuracy() {
        if (recognizedResponses.length === 0) return 0;
        
        let correctCount = 0;
        
        // Compare each recognized word with its corresponding expected word
        for (let i = 0; i < recognizedResponses.length && i < expectedResponses.length; i++) {
            // Simple check: if the recognized word includes the expected word
            if (recognizedResponses[i].includes(expectedResponses[i])) {
                correctCount++;
            }
        }
        
        // Calculate percentage
        const accuracy = Math.round((correctCount / Math.min(recognizedResponses.length, expectedResponses.length)) * 100);
        return accuracy;
    }
    
    function updateTimer(timerId) {
        if (!isTimerRunning) return;
        
        const now = new Date();
        const elapsed = (now - startTime) / 1000; // seconds
        
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        const milliseconds = Math.floor((elapsed % 1) * 100);
        
        const formattedTime = 
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0') + ':' +
            String(milliseconds).padStart(2, '0');
        
        document.getElementById(timerId).textContent = formattedTime;
        
        requestAnimationFrame(() => updateTimer(timerId));
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }
    
    function hideAllScreens() {
        Object.values(screens).forEach(screen => {
            screen.classList.add('hidden');
        });
    }
    
    function isCurrentScreen(screen) {
        return !screen.classList.contains('hidden');
    }
    
    function restartTest() {
        hideAllScreens();
        screens.intro.classList.remove('hidden');
        wordReadingTime = colorNamingTime = incongruentTime = 0;
        wordReadingAccuracy = colorNamingAccuracy = incongruentAccuracy = 0;
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.log('Recognition wasn\'t running', e);
            }
        }
        currentTestType = '';
    }
});
