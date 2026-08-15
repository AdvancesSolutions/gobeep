const Service = require('webos-service');
const pkgInfo = require('./package.json');

const service = new Service(pkgInfo.name);

let monitoringInterval = null;

// Command to start monitoring
service.register("startMonitoring", function(message) {
    if (monitoringInterval) {
        message.respond({
            returnValue: true,
            status: "Already monitoring"
        });
        return;
    }

    console.log("Starting channel monitoring...");

    // Set interval to check the current channel every 5 seconds
    monitoringInterval = setInterval(() => {
        service.call("luna://com.webos.service.tv.channel/getCurrentChannel", {}, function(response) {
            if (response.payload && response.payload.returnValue) {
                const channelName = response.payload.channelName;
                const channelNumber = response.payload.channelNumber;
                console.log("Current Channel:", channelName, channelNumber);
                
                // TODO: Here you would send the channel info to your API
                // Example:
                // fetch('https://api.seuservidor.com/tv/log', {
                //     method: 'POST',
                //     body: JSON.stringify({ channelName, channelNumber }),
                //     headers: { 'Content-Type': 'application/json' }
                // });
            } else {
                console.log("Failed to get current channel or no channel active", response.payload);
            }
        });
    }, 5000);

    message.respond({
        returnValue: true,
        status: "Monitoring started"
    });
});

// Command to stop monitoring
service.register("stopMonitoring", function(message) {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        message.respond({
            returnValue: true,
            status: "Monitoring stopped"
        });
    } else {
        message.respond({
            returnValue: true,
            status: "Not currently monitoring"
        });
    }
});

console.log("Beep App TV Service initialized");
