function makeFoldersArray() {
    return [
        {
            folder_id: "86a895b4-b446-4a8f-816f-e6e6e0ba0c86",
            name: "Big"
        },
        {
            folder_id: "8d53fc9b-d919-45e1-8de4-dcc51d8eb7aa",
            name: "Small"
        },
        {
            folder_id: "1e5f7b69-7855-4edf-adbb-c71ff17ca754",
            name: "Triangle"
        }
    ]
}

function makeMaliciousFolder() {
    const maliciousFolder = {
        folder_id: "b06121f7-ffaf-11e8-8eb2-f3701f1b6fd0",
        name: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
    }
    const expectedFolder = {
        ...maliciousFolder,
        folder_id: "b06121f7-ffaf-11e8-8eb2-f3701f1b6fd0",
        name: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }

    return {
        maliciousFolder,
        expectedFolder
    }
}

module.exports = {
    makeFoldersArray,
    makeMaliciousFolder
}