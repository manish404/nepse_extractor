// change URL/API here!
const URL = 'https://manish404.pythonanywhere.com/db/send';

// html elements;
let total_el, nepse_index_el, sensitive_index_el, dateEl, data_table;
function getElements() {
    // fetches html element after website gets loaded!
    total_el = document.querySelector("body > app-root > div > main > div > app-live-market > div > div > div:nth-child(2) > div.d-flex.flex-column.align-items-start.justify-content-start > div.livemarket__adv.d-flex.align-items-center > div"),
        nepse_index_el = document.querySelector("body > app-root > div > main > div > app-live-market > div > div > div:nth-child(3) > div > div:nth-child(1) > div"),
        sensitive_index_el = document.querySelector("body > app-root > div > main > div > app-live-market > div > div > div:nth-child(3) > div > div:nth-child(2) > div"),
        dateEl = document.querySelector("body > app-root > div > main > div > app-live-market > div > div > div:nth-child(1) > div > div > span"),
        data_table = document.querySelector("body > app-root > div > main > div > app-live-market > div > div > div.table-responsive > table > tbody");
}

// functions
function fn(top_el, el, child, convertInto = 'f') {
    /*
    top_el : parent element
    el : element name; eg: div, #..., etc.
    child : child element
    convertInto [options] : [s: string, i: integer, f: float]
    */
    let text = top_el.querySelector(`${el}:nth-child(${child})`).innerText;
    text = text.replace(/\,|\(|\)|\%/g, '');
    if (convertInto === 'i') text = parseInt(text);
    else if (convertInto === 'f') text = parseFloat(text);
    return text;
}

// Stock class
class Scrip {
    constructor(row) {
        return this.extract(row);
    }

    extract(row) {
        const col2 = row.querySelector('td:nth-child(2)');
        // return [symbol, data_from_row]
        return [col2.innerText, {
            'name': col2.title,
            'point_change': fn(row, 'td', 5),
            'percent_change': fn(row, 'td', 6),
            'price': {
                'latest_traded': fn(row, 'td', 3),
                'average': fn(row, 'td', 10),
                'open': fn(row, 'td', 7),
                'high': fn(row, 'td', 8),
                'low': fn(row, 'td', 9),
                'previous_closing': fn(row, 'td', 12)
            },
            'volume': fn(row, 'td', 11, 'i')
        }]
    }
}

// important functions
function fetch_data() {
    // console.log("[+] Fetching data!");
    const db = {};
    /*
    scrape data and return jsonified data;
    i) All details of shares;
    ii) Today's summary;
    */

    // today's market summary;
    db['date'] = dateEl.innerText.split(' ').splice(2, 6).join(' ');
    db['nepse_index'] = {
        'point': fn(nepse_index_el, 'span', 1, 'i'),
        'point_change': fn(nepse_index_el, 'span', 3),
        'percent_change': fn(nepse_index_el, 'span', 4)
    };
    db['sensitive_index'] = {
        'point': fn(sensitive_index_el, 'span', 1, 'i'),
        'point_change': fn(sensitive_index_el, 'span', 3),
        'percent_change': fn(sensitive_index_el, 'span', 4)
    };
    db['total'] = {
        'turnover': parseFloat(fn(total_el, 'div', 1, 's').split(' ').splice(3)[0]),
        'traded_shares': parseInt(fn(total_el, 'div', 2, 's').split(' ').splice(3)[0]),
        'transactions': parseInt(fn(total_el, 'div', 3, 's').split(' ').splice(2)[0]),
        'scrips_traded': parseInt(fn(total_el, 'div', 4, 's').split(' ').splice(3)[0])
    };

    // company/share data;
    db['companies'] = {};
    const rows = data_table.querySelectorAll('tr');
    rows.forEach(row => {
        const [name, scrip_detail] = new Scrip(row);
        db['companies'][name] = scrip_detail;
    });
    return db;
}

function send_data(data) {
    // console.log("[+] Sending data!");
    fetch(URL, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        mode: 'no-cors',
        body: JSON.stringify(data)
    });
    // console.log("[+] Data sent!");
    return 'Data has been sent!';
}

// publish updates on loop (checks every 5 seconds, sends if change is detected!)
function main() {
    let data, key, temp;
    key = dateEl.innerText;
    setInterval(() => {
        temp = dateEl.innerText;
        if (temp != key) {
            data = fetch_data();
            send_data(data);
            key = temp;
        }
    }, (1000 * 5));
}

// M A I N
setTimeout(() => {
    getElements();
    // console.log("[+] Extension Started!");
    main();
}, 1000);    // starts after 1 second