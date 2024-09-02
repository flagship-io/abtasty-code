(function () {
    const vscode = acquireVsCodeApi();
    document.getElementById('button').addEventListener('click', () => {
        const radioGroupValue = document.getElementById('radioGroup').value;
        if (radioGroupValue === "wep") {
            vscode.postMessage({
                command: 'webExperimentation.setCredentials',
            });
        }
        else {
            vscode.postMessage({
                command: 'featureExperimentation.setCredentials',
            });
        }


    });
}());
