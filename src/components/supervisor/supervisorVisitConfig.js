// =====================================================================
// Supervisor inspection form - question config (en / hi / gu).
// One entry per question, in the same order as the mobile app screens.
// `path` is relative to the section object and matches
// icds-backend/models/SupervisorVisit.js exactly.
//
// item types:
//   heading | info | yesno | number | text | textarea | time | date |
//   monthYear | select | radio | multicheck | photo |
//   pair  (two number inputs side by side)  |  group (title + children) |
//   stock (3 blocks x 4 numbers, stored as object)  |
//   stockArray (blocks stored as [{ item, ...numbers }])
// =====================================================================

const L = (en, hi, gu) => ({ en, hi, gu });

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ---- helpers shared by every section ----
export const getIn = (obj, path) =>
  path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function setIn(obj, path, value) {
  const keys = path.split(".");
  const next = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = next;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) {
      cur[k] = value;
      return;
    }
    const child = cur[k];
    cur[k] = Array.isArray(child) ? [...child] : { ...(child || {}) };
    cur = cur[k];
  });
  return next;
}

export const isMissing = (v) => v === undefined || v === null || v === "";

const YES_NO = (path, label, required = true) => ({ type: "yesno", path, label, required });

const STOCK_FIELDS = [
  { key: "totalBeneficiaries", label: L("Total beneficiaries", "कुल लाभार्थी", "કુલ લાભાર્થી") },
  { key: "balanceStock", label: L("Balance stock", "शेष स्टॉक", "બચત જથ્થો") },
  { key: "demand", label: L("Demand", "मांग", "ડીમાન્ડ") },
  { key: "found", label: L("Currently found", "वर्तमान में पाया गया", "હાલમાં જોવા મળેલ") },
];

const EQUIPMENT_OPTIONS = [
  { value: "working", label: L("Available and working", "उपलब्ध है और चालू हालत में है", "ઉપલબ્ધ છે અને ચાલુ હાલતમાં છે") },
  { value: "not_working", label: L("Available but not working", "उपलब्ध है और बंद हालत में है", "ઉપલબ્ધ છે અને બંધ હાલતમાં છે") },
  { value: "not_available", label: L("Not available", "उपलब्ध नहीं है", "ઉપલબ્ધ નથી") },
];

const QUALITY_F = [
  { value: "good", label: L("Good", "अच्छी", "સારી") },
  { value: "average", label: L("Average", "औसत", "સરેરાશ") },
  { value: "poor", label: L("Poor", "कमज़ोर", "નબળી") },
];
const QUALITY_N = [
  { value: "good", label: L("Good", "अच्छा", "સારું") },
  { value: "average", label: L("Average", "औसत", "સરેરાશ") },
  { value: "poor", label: L("Poor", "कमज़ोर", "નબળું") },
];

// =====================================================================
// SECTIONS
// =====================================================================
export const SECTIONS = {
  // ------------------------------------------------------------ GENERAL
  general: {
    id: "general",
    field: "general",
    title: L("General Section", "सामान्य अनुभाग", "જનરલ વિભાગ"),
    items: [
      { type: "heading", label: L("1. Anganwadi centre", "1. आंगनवाड़ी केंद्र", "1. આંગણવાડી કેન્દ્ર") },
      {
        type: "date",
        path: "visitDate",
        label: L(
          "1. Date of visit to the Anganwadi centre",
          "1. आंगनवाड़ी केंद्र के भ्रमण की तारीख",
          "૧. આંગણવાડી કેન્દ્ર મુલાકાત કર્યાની તારીખ :"
        ),
      },
      YES_NO(
        "centerOpen",
        L("2. Is the Anganwadi centre open?", "2. क्या आंगनवाड़ी केंद्र खुला है?", "૨. આંગણવાડી કેન્દ્ર ખુલ્લું છે?"),
        false
      ),
      {
        type: "time",
        path: "arrivalTime",
        label: L("4. Time of arrival at the Anganwadi", "4. आंगनवाड़ी में आने का समय", "૪. આંગણવાડીમાં આવવાનો સમય :"),
      },
    ],
  },

  // ---------------------------------------------------------- SECTION A
  a: {
    id: "a",
    field: "sectionA",
    title: L("Section A", "अनुभाग A", "સેક્શન A"),
    items: [
      { type: "heading", label: L("2. Building condition", "2. भवन की स्थिति", "2. બાંધકામની સ્થિતિ") },
      {
        type: "select",
        path: "building.ownership",
        label: L(
          "5. In whose building does the Anganwadi run?",
          "5. आंगनवाड़ी किसके भवन में चलती है?",
          "5. આંગણવાડી કોના મકાનમાં ચાલે છે:"
        ),
        options: [
          { value: "own", label: L("Own building", "अपने भवन में", "પોતાના મકાનમાં") },
          { value: "rented", label: L("Rented building", "किराये के भवन में", "ભાડાના મકાનમાં") },
          { value: "school", label: L("School building", "विद्यालय भवन में", "શાળાના મકાનમાં") },
          { value: "other", label: L("Other", "अन्य", "અન્ય") },
        ],
      },
      YES_NO("building.isDilapidated", L("7. Is the Anganwadi building dilapidated?", "7. क्या आंगनवाड़ी भवन जर्जर है?", "7. આંગણવાડી જર્જરીત છે?")),
      YES_NO(
        "building.repairNeeded",
        L(
          "8. Is repair needed? (Note: electrical work, plumbing work, lighting installation, toilet repair or other minor repairs)",
          "8. क्या मरम्मत की आवश्यकता है? (नोट: इलेक्ट्रिकल कार्य, प्लंबिंग कार्य, लाइटिंग इंस्टॉलेशन, शौचालय की मरम्मत या अन्य छोटी मरम्मत)",
          "8. રિપેરિંગની જરૂર છે? (નોંધ: ઇલેક્ટ્રિકલ વર્ક, પ્લમ્બિંગ વર્ક, લાઇટિંગ ઇન્સ્ટોલેશન, શૌચાલયનું સમારકામ અથવા અન્ય નાના સમારકામ)?"
        )
      ),
      YES_NO(
        "building.upgradationNeeded",
        L(
          "9. Is renovation (upgradation) needed? (Note: plaster work, masonry, painting, flooring or major civil work)",
          "9. क्या नवीनीकरण (अपग्रेडेशन) की आवश्यकता है? (नोट: प्लास्टर कार्य, चिनाई कार्य, रंगाई-पुताई, फ्लोरिंग या मुख्य सिविल कार्य)",
          "9. નવીનીકરણ(અપગ્રેડેશન)ની જરૂર છે? (નોંધ:પ્લાસ્ટર કામ,ચણતર કામ,રંગકામ(ફ્લોરિંગ વર્ક અથવા મુખ્ય સિવિલ વર્ક)?"
        )
      ),
      YES_NO("building.toiletWorking", L("10. Is the toilet in working condition?", "10. क्या शौचालय चालू हालत में है?", "10. શૌચાલય ચાલુ હાલતમાં છે?")),
      YES_NO(
        "building.drinkingWater",
        L("11. Is drinking water available? (tap connection)", "11. क्या पीने के पानी की सुविधा है? (नल की व्यवस्था)", "11. પીવાના પાણીની સુવિધા છે?(નળ ની વયવસ્થા)")
      ),
      YES_NO(
        "building.electricity",
        L("12. Is electricity available? (in working condition)", "12. क्या बिजली की सुविधा है? (चालू हालत में)", "12. વીજળીની સુવિધા છે?(ચાલુ હાલતમાં)")
      ),
      YES_NO("building.compoundWall", L("13. Is there a compound wall?", "13. क्या कंपाउंड वॉल है?", "13. કમ્પાઉન્ડ વોલ છે?")),

      { type: "heading", label: L("3. Supplementary nutrition", "3. पूरक पोषण", "3. પૂરક પોષણ") },
      {
        type: "pair",
        label: L(
          "14. Out of the registered children (3-6 years), how many are present during the visit?",
          "14. पंजीकृत बच्चों (3-6 वर्ष) की संख्या के सामने भ्रमण के दौरान कितने बच्चे उपस्थित हैं?",
          "14. નોંધાયેલ બાળકો(૩-૬ વર્ષ) ની સંખ્યા સામે મુલાકાત દરમ્યાન કેટલા બાળકો હાજર છે?"
        ),
        fields: [
          { path: "supplementaryNutrition.registeredChildren3To6", required: true, label: L("Registered children", "पंजीकृत बच्चे", "નોંધાયેલ બાળકો:") },
          { path: "supplementaryNutrition.presentChildren", required: true, label: L("Present children", "उपस्थित बच्चे", "હાજર બાળકો:") },
        ],
      },
      YES_NO(
        "supplementaryNutrition.hotBreakfastAsPerMenu",
        L(
          "15. Is the hot breakfast given to children as per the menu?",
          "15. क्या बच्चों को दिया जाने वाला गर्म नाश्ता मेनू के अनुसार है?",
          "15. બાળકોને આપવામાં આવતો ગરમ નાસ્તો મેનુ મુજબ છે કે નહિ ?"
        )
      ),
      {
        type: "number",
        path: "supplementaryNutrition.purnaRegisteredGirls15To18",
        required: true,
        label: L(
          "18. Number of registered adolescent girls (15-18) (PURNA)",
          "18. पंजीकृत किशोरियों (15-18) की संख्या (PURNA)",
          "18. નોંધાયેલ કિશોરીઓ (૧૫-૧૮) ની સંખ્યા (PURNA)"
        ),
      },
      {
        type: "number",
        path: "supplementaryNutrition.purnaGirlsTookThr",
        required: true,
        label: L(
          "19. Number of adolescent girls (15-18) who took THR benefit (PURNA)",
          "19. THR का लाभ लेने वाली किशोरियों (15-18) की संख्या (PURNA)",
          "19. THRનો લાભ લીધેલ કિશોરીઓ (૧૫-૧૮) ની સંખ્યા (PURNA)"
        ),
      },
      YES_NO(
        "supplementaryNutrition.thrDistributionComplete",
        L("21. Is this month's THR distribution complete?", "21. क्या चालू माह का THR वितरण पूर्ण हो गया है?", "21. ચાલુ માસનું THR વિતરણ પૂર્ણ થયેલ છે?")
      ),
      {
        type: "stock",
        path: "supplementaryNutrition.thrStock",
        label: L(
          "22. Against the THR stock that should actually be available (last month's balance + this month's receipt - this month's distribution), the THR balance stock found during the visit (in packets)",
          "22. पिछले माह के शेष स्टॉक, चालू माह की आवक और चालू माह के वितरण के बाद वास्तव में होने योग्य THR के शेष स्टॉक के सामने भ्रमण के दौरान पाया गया THR का शेष स्टॉक (पैकेट में)",
          "22. ગત માસનો બચત જથ્થો,ચાલુ માસની આવક અને ચાલુ માસના વિતરણ બાદ ખરેખર હોવા પાત્ર THR નાં બચત જથ્થાની સામે મુલાકાત દરમિયાન જોવા મળેલ THR નો બચત જથ્થો (પેકેટમાં)"
        ),
        blocks: [
          { key: "balshakti", label: L("Balshakti", "बालशक्ति", "બાલશક્તિ") },
          { key: "matrushakti", label: L("Matrushakti", "मातृशक्ति", "માતૃશક્તિ") },
          { key: "purnashakti", label: L("Purnashakti", "पूर्णाशक्ति", "પૂર્ણાશક્તિ") },
        ],
        fields: STOCK_FIELDS,
      },
      {
        type: "stockArray",
        path: "supplementaryNutrition.hcmStock",
        label: L(
          "23. Against the HCM stock that should actually be available (last month's balance + this month's receipt - this month's distribution), the HCM balance stock found during the visit (in kg)",
          "23. पिछले माह के शेष स्टॉक, चालू माह की आवक और चालू माह के वितरण के बाद वास्तव में होने योग्य HCM के शेष स्टॉक के सामने भ्रमण के दौरान पाया गया HCM का शेष स्टॉक (कि.ग्रा. में)",
          "23. ગત માસનો બચત જથ્થો,ચાલુ માસની આવક અને ચાલુ માસના વિતરણ બાદ ખરેખર હોવા પાત્ર HCM નાં બચત જથ્થાની સામે મુલાકાત દરમ્યાન જોવા મળેલ HCM નો બચત જથ્થો (કિ.ગ્રા.માં)"
        ),
        foundSuffix: L("(in kg)", "(कि. ग्रा. में)", "(કિ. ગ્રા.માં)"),
        blocks: [
          { key: "fortifiedFlour", label: L("Fortified flour", "फोर्टिफाइड आटा", "ફોર્ટીફાઈડ આટા") },
          { key: "rice", label: L("Rice", "चावल", "ચોખા") },
          { key: "oil", label: L("Oil", "तेल", "તેલ") },
        ],
        fields: STOCK_FIELDS,
      },
    ],
  },

  // ---------------------------------------------------------- SECTION B
  b: {
    id: "b",
    field: "sectionB",
    title: L("Section B", "अनुभाग B", "સેક્શન B"),
    items: [
      { type: "heading", label: L("4. Poshan Sudha", "4. पोषण सुधा", "4. પોષણ સુધા") },
      {
        type: "pair",
        label: L(
          "24. Number of beneficiaries present during the visit against those registered under the Poshan Sudha Yojana",
          "24. पोषण सुधा योजना के अंतर्गत पंजीकृत लाभार्थियों के सामने भ्रमण के दौरान उपस्थित लाभार्थियों की संख्या",
          "24. પોષણ સુધા યોજના અંતર્ગત નોંધાયેલ લાભાર્થીઓની સામે મુલાકાત દરમ્યાન હાજર રહેલા લાભાર્થીઓ ની સંખ્યા"
        ),
        fields: [
          { path: "poshanSudha.registeredBeneficiaries", label: L("Registered beneficiaries", "पंजीकृत लाभार्थी", "નોંધાયેલ લાભાર્થી:") },
          { path: "poshanSudha.presentBeneficiaries", label: L("Present beneficiaries", "उपस्थित लाभार्थी", "હાજર રહેલ લાભાર્થી :") },
        ],
      },
      YES_NO(
        "poshanSudha.psyMealAsPerMenu",
        L(
          "25. Is the meal given to mothers under the PSY scheme as per the menu?",
          "25. क्या PSY योजना के अंतर्गत माताओं को दिया जाने वाला भोजन मेनू के अनुसार है?",
          "25. PSY યોજના અંતર્ગત માતાઓને આપવામાં આવતું ભોજન મેનુ મુજબ છે કે નહિ ?"
        ),
        false
      ),
      {
        type: "monthYear",
        path: "poshanSudha.localPurchaseBillsPaidTill",
        label: L(
          "26. Up to which month have the local purchase bills under the Poshan Sudha Yojana been paid?",
          "26. पोषण सुधा योजना के अंतर्गत स्थानीय खरीद के बिलों का भुगतान किस माह तक किया गया है?",
          "26. પોષણ સુધા યોજના અંતર્ગત સ્થાનિક ખરીદીના બિલોની ચૂકવણી કયા માસ સુધી કરવામાં આવેલ છે?"
        ),
      },
      YES_NO(
        "poshanSudha.dailyAttendanceFilled",
        L(
          "27. Is the daily attendance filled in the Poshan Sudha Yojana application?",
          "27. क्या पोषण सुधा योजना के एप्लिकेशन में दैनिक उपस्थिति भरी गई है?",
          "27. પોષણ સુધા યોજનાના એપ્લીકેશનમાં દૈનિક હાજરી ભરેલ છે?"
        ),
        false
      ),

      { type: "heading", label: L("5. Milk Sanjivani", "5. दूध संजीवनी", "5. દૂધ સંજીવની") },
      YES_NO("milkReceivedToday", L("28. Was milk received today?", "28. क्या आज दूध मिला?", "28. આજે દૂધ મેળવ્યું"), false),
      {
        type: "pair",
        label: L(
          "29. How much milk was demanded and how many packets were received?",
          "29. दूध की कितनी मांग की गई और कितने पैकेट मिले?",
          "29. દૂધની કેટલી ડીમાંડ કરેલ અને કેટલા પેકેટ મળેલ છે?"
        ),
        fields: [
          { path: "milkPacketsDemanded", label: L("Number of packets demanded", "मांगे गए पैकेट की संख्या", "ડીમાંડ કરેલ પેકેટની સંખ્યા:") },
          { path: "milkPacketsReceived", label: L("Number of packets received", "प्राप्त पैकेट की संख्या", "મળેલ પેકેટની સંખ્યા") },
        ],
      },
      {
        type: "group",
        label: L(
          "31. Number of beneficiaries present during the visit against those registered under the Milk Sanjivani Yojana",
          "31. दूध संजीवनी योजना के अंतर्गत पंजीकृत लाभार्थियों के सामने भ्रमण के दौरान उपस्थित लाभार्थियों की संख्या",
          "31. દૂધ સંજીવની યોજના અંતર્ગત નોંધાયેલ લાભાર્થીઓની સામે મુલાકાત દરમ્યાન હાજર રહેલા લાભાર્થીઓ ની સંખ્યા"
        ),
        children: [
          { type: "number", path: "registeredBeneficiaries.pregnantLactating", label: L("Registered pregnant & lactating women", "पंजीकृत गर्भवती एवं धात्री", "નોંધાયેલ સગર્ભા અને ધાત્રી") },
          { type: "number", path: "registeredBeneficiaries.children7mTo3y", label: L("Registered children 7 months - 3 years", "पंजीकृत 7 माह से 3 वर्ष के बच्चे", "નોંધાયેલ ૭ માસથી ૩ વર્ષનાં બાળકો:") },
          { type: "number", path: "registeredBeneficiaries.children3To6y", label: L("Registered children 3 - 6 years", "पंजीकृत 3 से 6 वर्ष के बच्चे", "નોંધાયેલ 3 વર્ષથી ૬ વર્ષનાં બાળકો:") },
          {
            type: "info",
            label: L(
              "Number of beneficiaries given milk in your presence:",
              "आपकी उपस्थिति में दूध दिए गए लाभार्थियों की संख्या:",
              "આપની હાજરીમાં દૂધ આપવામાં આવેલ લાભાર્થીની સંખ્યા:"
            ),
          },
          { type: "number", path: "beneficiariesServedInPresence.pregnantLactating", label: L("Pregnant & lactating women", "गर्भवती एवं धात्री", "સગર્ભા અને ધાત્રી:") },
          { type: "number", path: "beneficiariesServedInPresence.children7mTo3y", label: L("Children 7 months - 3 years", "7 माह से 3 वर्ष के बच्चे", "૭ માસથી ૩ વર્ષનાં બાળકો:") },
          { type: "number", path: "beneficiariesServedInPresence.children3To6y", label: L("Children 3 - 6 years", "3 से 6 वर्ष के बच्चे", "૩ વર્ષથી ૬ વર્ષનાં બાળકો:") },
        ],
      },
    ],
  },

  // ---------------------------------------------------------- SECTION C
  c: {
    id: "c",
    field: "sectionC",
    title: L("Section C", "अनुभाग C", "સેક્શન C"),
    items: [
      { type: "heading", label: L("6. Pre-primary education", "6. पूर्व प्राथमिक शिक्षा", "6. પૂર્વ પ્રાથમિક શિક્ષણ") },
      YES_NO(
        "preSchool.kitUsed",
        L(
          "33. During the visit, is the pre-school kit used for pre-primary education activities in the Anganwadi?",
          "33. भ्रमण के समय क्या आंगनवाड़ी में प्री-स्कूल किट का उपयोग पूर्व प्राथमिक शिक्षा की गतिविधियों के लिए होता है?",
          "33. મુલાકાત સમયે આંગણવાડીમાં પ્રિ-સ્કૂલ કિટનો ઉપયોગ પૂર્વ પ્રાથમિક શિક્ષણની પ્રવૃત્તિ કરાવવા માટે થાય છે ?"
        )
      ),
      YES_NO(
        "preSchool.activitiesAsPerThemeTimetable",
        L(
          "34. During the visit, are activities held as per the theme and timetable?",
          "34. भ्रमण के दौरान क्या थीम और समय-सारणी के अनुसार गतिविधि होती है?",
          "34. મુલાકાત દરમિયાન થીમ અને સમયપત્રક પ્રમાણે પ્રવૃત્તિ થાય છે"
        )
      ),
      YES_NO(
        "preSchool.childDetailsAndPlayActivities",
        L(
          "35. During the visit, have activities been done for all children with name, age, date and signature in Ramatgamat Part 1, 2 and the Chitrapothi?",
          "35. भ्रमण के समय आंगनवाड़ी में सभी बच्चों के नाम, उम्र, तारीख और हस्ताक्षर के साथ रमतगमत भाग - 1, 2 और चित्रपोथी में गतिविधि कराई गई है?",
          "35.મુલાકાત સમયે આંગણવાડીમાં તમામ બાળકોના નામ, ઉંમર, તારીખ અને સહી સાથે રમતગમત ભાગ – ૧,૨ અને ચિત્રપોથીમાં પ્રવૃત્તિ કરાવેલ છે?"
        )
      ),
      {
        type: "select",
        path: "preSchool.vikasyatraFilledMonth",
        required: true,
        label: L(
          "36. Tick the month in which 'Mari Vikasyatra' of all children aged 3 to 6 has been filled",
          "36. 3 से 6 वर्ष के सभी बच्चों की 'मारी विकासयात्रा' जिस माह में भरी है उस पर टिक करें",
          "36. ૩ થી ૬ વર્ષના તમામ બાળકોની મારી વિકાસયાત્રા જે મહિનામાં ભરેલી છે તેના પર ટીક માર્ક કરો?"
        ),
        options: MONTHS.map((m) => ({ value: m, label: L(m, m, m) })),
      },


      { type: "heading", label: L("Mangal Divas celebration", "मंगल दिवस का उत्सव", "મંગળદિવસની ઉજવણી") },
      {
        type: "group",
        label: L(
          "40. Are the four Tuesday celebrations held?",
          "40. क्या चारों मंगलवार का उत्सव होता है?",
          "40. ચાર મંગળવારની ઉજવણી થાય છે?"
        ),
        children: [
          YES_NO("mangalDivas.suposhanSamvad", L("Suposhan Samvad", "सुपोषण संवाद", "સુપોષણ સંવાદ")),
          YES_NO("mangalDivas.baltulaDivas", L("Baltula Divas", "बालतुला दिवस", "બાળતુલા દિવસ")),
          YES_NO("mangalDivas.annaprashanBalDivas", L("Annaprashan / Bal Divas", "अन्नप्राशन/बाल दिवस", "અન્નપ્રાશન/બાળ દિવસ")),
          YES_NO("mangalDivas.annaVitaranDivas", L("Anna Vitaran Divas", "अन्न वितरण दिवस", "અન્ન વિતરણ દિવસ")),
        ],
      },

      { type: "heading", label: L("7. Poshan Abhiyan", "7. पोषण अभियान", "7. પોષણ અભિયાન") },
      {
        type: "group",
        label: L(
          "41. Are the growth measuring instruments in working condition?",
          "41. क्या वृद्धि मापन के साधन चालू हालत में हैं?",
          "41. વૃદ્ધિ માપનનાં સાધન ચાલુ હાલતમાં છે?"
        ),
        children: [
          { type: "radio", path: "growthEquipment.infantometer", required: true, label: L("Infantometer", "इन्फेंटोमीटर", "ઇન્ફેન્ટોમીટર"), options: EQUIPMENT_OPTIONS },
          { type: "radio", path: "growthEquipment.salterScale", required: true, label: L("Salter scale", "सॉल्टर स्केल", "સોલ્ટર સ્કેલ"), options: EQUIPMENT_OPTIONS },
          { type: "radio", path: "growthEquipment.stadiometer", required: true, label: L("Stadiometer", "स्टेडियोमीटर", "સ્ટેડીઓમીટર"), options: EQUIPMENT_OPTIONS },
          { type: "radio", path: "growthEquipment.weighingScale", required: true, label: L("Weighing scale", "वजन कांटा", "વજન કાંટો"), options: EQUIPMENT_OPTIONS },
        ],
      },
      YES_NO(
        "adolescentWeightHeightDone",
        L(
          "42. Is the weight - height of adolescent girls measured?",
          "42. क्या किशोरियों का वजन-ऊंचाई मापा जाता है?",
          "42. કિશોરીઓનું વજન – ઉંચાઈ કરવામાં આવે છે કે નહીં?"
        )
      ),
      {
        type: "group",
        label: L(
          "Take a photo while measuring a child's height & weight (with the child's name)",
          "बच्चे की ऊंचाई और वज़न मापते समय फोटो लें (बच्चे के नाम के साथ)",
          "બાળકની ઊંચાઈ અને વજન કરતી વખતે ફોટો પાડો (બાળકના નામ સાથે)"
        ),
        children: [
          { type: "text", path: "heightWeightCheck.childName", label: L("Child's name", "बच्चे का नाम", "બાળકનું નામ") },
          { type: "number", path: "heightWeightCheck.heightCm", label: L("Height (cm)", "ऊंचाई (सेमी)", "ઊંચાઈ (સે.મી.)") },
          { type: "number", path: "heightWeightCheck.weightKg", label: L("Weight (kg)", "वज़न (किग्रा)", "વજન (કિ.ગ્રા.)") },
          {
            type: "photo",
            path: "heightWeightCheck.photo",
            label: L("Photo of the child while measuring height & weight", "ऊंचाई व वज़न मापते समय बच्चे का फोटो", "ઊંચાઈ અને વજન માપતી વખતે બાળકનો ફોટો"),
          },
        ],
      },

      { type: "heading", label: L("Observation", "अवलोकन", "અવલોકન") },
      YES_NO("observation.anganwadiClean", L("44. Is the Anganwadi clean?", "44. क्या आंगनवाड़ी में स्वच्छता है?", "44. શું આંગણવાડીમાં સ્વચ્છતા છે?")),
      YES_NO(
        "observation.surroundingsClean",
        L("45. Is it clean inside / outside the Anganwadi?", "45. क्या आंगनवाड़ी के अंदर/बाहर स्वच्छता है?", "45. શું આંગણવાડીની અંદર/બહાર સ્વચ્છતા છે?")
      ),
      {
        type: "radio",
        path: "observation.hotBreakfastQuality",
        required: true,
        label: L("46. How is the quality of the hot breakfast?", "46. गर्म नाश्ते की गुणवत्ता कैसी है?", "46. ગરમ નાસ્તાની ગુણવત્તા કેવી છે?"),
        options: QUALITY_F,
      },
      {
        type: "radio",
        path: "observation.workerKnowledge",
        required: true,
        label: L(
          "47. Select after observing the worker's knowledge",
          "47. कार्यकर्ता के ज्ञान का अवलोकन कर चुनें",
          "47. કાર્યકરનું જ્ઞાન અવલોકન કરીને પસંદ કરો."
        ),
        options: QUALITY_N,
      },
      {
        type: "radio",
        path: "observation.anganwadiRanking",
        required: true,
        label: L("48. Anganwadi ranking", "48. आंगनवाड़ी की रैंकिंग", "48. આંગણવાડીનું રેન્કિંગ"),
        options: [
          { value: "A", label: L("A. Very Good", "A. बहुत अच्छा", "A. Very Good") },
          { value: "B", label: L("B. Good", "B. अच्छा", "B. Good") },
          { value: "C", label: L("C. Average", "C. औसत", "C. Average") },
          { value: "D", label: L("D. Poor", "D. कमज़ोर", "D. Poor") },
        ],
      },
      { type: "textarea", path: "remarks", label: L("49. Remarks (optional)", "49. टिप्पणी (वैकल्पिक)", "49. Remarks") },
      {
        type: "photo",
        path: "mealPlatePhoto",
        label: L(
          "50. Photo of the HCM or PSY meal plate",
          "50. HCM या PSY भोजन की प्लेट का फोटो",
          "50. HCM અથવા PSY ભોજનની પ્લેટનો ફોટો"
        ),
      },
      {
        type: "photo",
        path: "leavingPhoto",
        label: L("51. Photo while leaving the Anganwadi", "51. आंगनवाड़ी छोड़ते समय का फोटो", "51. આંગણવાડી છોડવાનો સમય - ફોટો"),
      },
      {
        type: "time",
        path: "leavingTime",
        sameNumber: true, // shares the number of the leaving photo above
        required: true,
        label: L("51. Time of leaving the Anganwadi", "51. आंगनवाड़ी छोड़ने का समय", "51. આંગણવાડી છોડવાનો સમય"),
      },
    ],
  },
};

export const SECTION_ORDER = ["general", "a", "b", "c"];

// flat list of every item (recursing into groups)
const flatten = (items) =>
  items.flatMap((it) => [it, ...(it.children ? flatten(it.children) : []), ...(it.fields || [])]);

// Paths marked * - mirrors REQUIRED in icds-backend/controllers/supervisorVisitController.js
export function requiredPaths(sectionId) {
  const out = [];
  flatten(SECTIONS[sectionId].items).forEach((it) => {
    if (!it.required || !it.path) return;
    // month/year pickers need both parts (backend checks ".month" and ".year")
    if (it.type === "monthYear") out.push(`${it.path}.month`, `${it.path}.year`);
    else out.push(it.path);
  });
  return out;
}

// pre-fill values that come from the AWC / visit (only applied when still empty)
export function sectionDefaults(sectionId, { prefill, visit }) {
  const d = {};
  if (sectionId === "general" && visit?.date) d.visitDate = new Date(visit.date).toISOString().slice(0, 10);
  if (sectionId === "a" && prefill?.registeredChildren3To6 != null)
    d["supplementaryNutrition.registeredChildren3To6"] = prefill.registeredChildren3To6;
  if (sectionId === "b" && prefill?.registeredChildren3To6 != null)
    d["registeredBeneficiaries.children3To6y"] = prefill.registeredChildren3To6;
  return d;
}

// =====================================================================
// AUTO NUMBERING
// Questions are numbered continuously 1, 2, 3 ... across General -> A -> B -> C
// in the order they appear. So when a question is removed, the next one
// automatically takes its number. Any number typed in a label is replaced.
// (Section headings like "2. Building condition" are not questions - untouched.)
// =====================================================================
(function renumberQuestions() {
  const STRIP = /^\s*[0-9\u0AE6-\u0AEF\u0966-\u096F]+\s*[.)]\s*/;
  let n = 0;
  SECTION_ORDER.forEach((id) => {
    SECTIONS[id].items.forEach((item) => {
      if (item.type === "heading" || item.type === "info") return;
      if (!item.sameNumber) n += 1;
      Object.keys(item.label).forEach((lng) => {
        item.label[lng] = `${n}. ${item.label[lng].replace(STRIP, "")}`;
      });
    });
  });
})();
