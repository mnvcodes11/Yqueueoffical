import urllib.request
import urllib.parse
import re
import json

queries = [
    ('Poha', 'poha'),
    ('Idli Sambar', 'idli sambar'),
    ('Masala Dosa', 'masala dosa'),
    ('Aloo Paratha', 'aloo paratha'),
    ('Samosa', 'samosa'),
    ('Paneer Wrap', 'paneer wrap'),
    ('Paneer Sandwich', 'paneer sandwich'),
    ('Veg Burger', 'veg burger'),
    ('Pav Bhaji', 'pav bhaji'),
    ('Chole Bhature', 'chole bhature'),
    ('Veg Pulao', 'veg pulao'),
    ('Veg Fried Rice', 'vegetable fried rice'),
    ('Hakka Noodles', 'hakka noodles'),
    ('Veg Momos', 'vegetable momos'),
    ('French Fries', 'french fries'),
    ('Maggi', 'maggi noodles'),
    ('Paneer Tikka Roll', 'paneer tikka roll'),
    ('Cold Coffee', 'cold coffee'),
    ('Lassi', 'lassi'),
    ('Tea', 'tea'),
    ('Coffee', 'coffee'),
    ('Gulab Jamun', 'gulab jamun'),
    ('Jalebi', 'jalebi'),
    ('Brownie', 'brownie'),
    ('Dahi Puri', 'dahi puri'),
    ('Veg Thali', 'veg thali'),
    ('Rajma Chawal', 'rajma chawal'),
    ('Dal Makhani', 'dal makhani'),
    ('Paneer Butter Masala', 'paneer butter masala'),
    ('Chana Masala', 'chana masala'),
    ('Bread Pakora', 'bread pakora'),
    ('Veg Cutlet', 'vegetable cutlet'),
    ('Corn Chaat', 'corn chaat'),
    ('Aloo Tikki', 'aloo tikki'),
    ('Veg Spring Roll', 'spring roll'),
    ('Gobi Manchurian', 'gobi manchurian'),
    ('Masala Chai', 'masala chai'),
    ('Nimbu Pani', 'lemonade'),
    ('Rasmalai', 'rasmalai'),
    ('Paneer Tikka', 'paneer tikka'),
]

results = {}

for name, q in queries:
    url = 'https://unsplash.com/s/photos/' + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    print('Fetching', name, 'from', url)
    data = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', errors='replace')

    urls = []
    urls.extend(re.findall(r'src="([^"]*images.unsplash.com[^"]*)"', data))
    urls.extend(re.findall(r'srcset="([^"]*images.unsplash.com[^"]*)"', data))
    urls = [u for u in urls if 'profile-' not in u and 'premium_photo' not in u and '&fmt=' not in u]
    urls = [u.split('?')[0] for u in urls if u]

    if not urls:
        urls.extend(re.findall(r'https://images.unsplash.com/[^"\s]+', data))
        urls = [u.split('?')[0] for u in urls if 'profile-' not in u and 'premium_photo' not in u]

    if urls:
        results[name] = urls[0]
    else:
        results[name] = 'MISSING'

print(json.dumps(results, indent=2))
