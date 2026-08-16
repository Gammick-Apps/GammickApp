const { ipcRenderer } = require('electron')

// גשר ההדפסה. האתר שולח היום:
//   window.parent.postMessage({ source: 'startPrint', printContent }, '*')
// עכשיו שהאתר הוא הדף העליון, window.parent === window, וההודעה נקלטת
// כאן — בלי שום שינוי בקוד של האתר.
//
// הערה: הגשר הכללי contextBridge.exposeInMainWorld('expose') הוסר בכוונה.
// קודם ה-preload רץ רק על index.html המקומי, אז האתר לא ראה אותו בכלל.
// עכשיו האתר הוא ה-main frame, ולהשאיר גשר כללי היה נותן לאתר מרוחק
// גישה חופשית לכל ערוץ IPC.
window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;

    if (event.data && event.data.source === 'startPrint') {
        ipcRenderer.send('sendPrint', event.data.printContent);
    }
});

// עכשיו שהאתר הוא ה-origin העליון אפשר לבקש אחסון עמיד, כדי שכרומיום
// לא יפנה אותו תחת לחץ מקום. מתוך iframe הבקשה הזו לא הייתה מתקבלת.
window.addEventListener('load', () => {
    if (!navigator.storage || !navigator.storage.persist) return;

    navigator.storage.persisted()
        .then((already) => (already ? true : navigator.storage.persist()))
        .then((granted) => console.log(`[gammick] אחסון עמיד: ${granted}`))
        .catch((err) => console.warn('[gammick] בקשת אחסון עמיד נכשלה:', err));
});
