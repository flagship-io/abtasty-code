(function () {
    document.getElementById('radioGroup').addEventListener('click', () => {
        const radioGroupValue = document.getElementById('radioGroup').value;
        if (radioGroupValue === "wep") {
            document.getElementById("feature-links").style.display = "none";
            document.getElementById("web-links").style.display = "block";
        } else {
            document.getElementById("feature-links").style.display = "block";
            document.getElementById("web-links").style.display = "none";
        }
    });
}());

