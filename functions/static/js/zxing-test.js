// Test if ZXing library is loaded correctly
console.log('ZXing test script loaded');

function testZXing() {
    console.log('Testing ZXing library...');
    try {
        if (typeof ZXing === 'undefined') {
            console.error('ZXing is undefined');
            return false;
        }
        console.log('ZXing object:', ZXing);
        
        try {
            const reader = new ZXing.BrowserMultiFormatReader();
            console.log('Successfully created BrowserMultiFormatReader instance');
            return true;
        } catch (err) {
            console.error('Failed to create BrowserMultiFormatReader:', err);
            return false;
        }
    } catch (err) {
        console.error('Error testing ZXing:', err);
        return false;
    }
}

// Run test when page loads
window.addEventListener('load', () => {
    console.log('Running ZXing test...');
    const result = testZXing();
    console.log('ZXing test result:', result ? 'SUCCESS' : 'FAILED');
    
    // Display result on page
    const testDiv = document.createElement('div');
    testDiv.style.position = 'fixed';
    testDiv.style.top = '10px';
    testDiv.style.right = '10px';
    testDiv.style.padding = '10px';
    testDiv.style.background = result ? '#dfd' : '#fdd';
    testDiv.style.border = '1px solid ' + (result ? '#0a0' : '#a00');
    testDiv.style.borderRadius = '5px';
    testDiv.style.zIndex = '9999';
    testDiv.innerHTML = 'ZXing Test: ' + (result ? 'SUCCESS' : 'FAILED');
    document.body.appendChild(testDiv);
});