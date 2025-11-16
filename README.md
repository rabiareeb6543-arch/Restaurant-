<!DOCTYPE html>
<html>
<head>
    <title>Delish Dine Restaurant</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f6f2;
            margin: 0;
            padding: 0;
        }

        /* Header Section */
        .header {
            background-color: #a9441b;
            color: white;
            text-align: center;
            padding: 20px;
        }

        .header h1 {
            margin: 0;
        }

        .header h3 {
            font-style: italic;
            color: #ffddb6;
        }

        .intro {
            text-align: center;
            margin: 10px auto;
            width: 80%;
            font-size: 16px;
        }

        hr {
            width: 70%;
            border: 1px solid #fff;
        }

        /* Menu Section */
        .menu {
            text-align: center;
            margin-top: 20px;
        }

        table {
            width: 60%;
            margin: 0 auto;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid #a9441b;
            padding: 10px;
            text-align: center;
        }

        th {
            background-color: #ffe5cc;
            color: #a9441b;
        }

        td {
            background-color: #fff8f2;
        }

        /* Offers Section */
        .offers {
            width: 60%;
            margin: 30px auto;
            background-color: #fff3e0;
            border-left: 5px solid #a9441b;
            padding: 15px;
        }

        .offers h3 {
            text-align: center;
            color: #a9441b;
        }

        .offers ul {
            font-size: 15px;
            line-height: 1.8;
        }

        /* Contact Form */
        .contact {
            width: 60%;
            margin: 30px auto;
            background-color: #ffe7cc;
            padding: 20px;
            border-radius: 8px;
        }

        .contact h3 {
            text-align: center;
            color: #a9441b;
        }

        input, textarea {
            width: 95%;
            padding: 8px;
            margin: 6px 0;
            border: 1px solid #a9441b;
            border-radius: 4px;
        }

        textarea {
            height: 80px;
        }

        button {
            display: block;
            width: 97%;
            padding: 10px;
            background-color: #a9441b;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        button:hover {
            background-color: #802f0f;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Delish Dine Restaurant</h1>
        <h3>Taste that touches your heart"</h3>
        <hr>
        <p class="intro">
            Welcome to <b>Delish Dine</b> - where every meal is crafted with <i>love</i>, <u>flavor</u>, and <big>freshness</big>.
        </p>
        <p>
            We serve <small>happiness</small> in every bite!
        </p>
    </div>

    <div class="menu">
        <h2><u>Our Menu</u></h2>
        <table>
            <tr>
                <th>Dish Name</th>
                <th>Type</th>
                <th>Price</th>
            </tr>
            <tr>
                <td>Chicken Alfredo Pasta</td>
                <td>Main</td>
                <td>Rs. 850</td>
            </tr>
            <tr>
                <td>Caesar Salad</td>
                <td>Starter</td>
                <td>Rs. 450</td>
            </tr>
            <tr>
                <td>Grilled Fish</td>
                <td>Main</td>
                <td>Rs. 950</td>
            </tr>
            <tr>
                <td>Chocolate Lava Cake</td>
                <td>Dessert</td>
                <td>Rs. 550</td>
            </tr>
            <tr>
                <td>French Fries</td>
                <td>Starter</td>
                <td>Rs. 300</td>
            </tr>
        </table>
    </div>

    <div class="offers">
        <h3>Our Special Offers</h3>
        <ul>
            <li>Buy One Get One Free on Weekends</li>
            <li>Free Dessert with Family Combo</li>
            <li>20% Discount for Students</li>
            <li>Home Delivery Available</li>
        </ul>
    </div>

    <div class="contact">
        <h3>Contact Us</h3>
        <form>
            <label>Name:</label><br>
            <input type="text" placeholder="Enter your name"><br>
            <label>Email:</label><br>
            <input type="email" placeholder="Enter your email"><br>
            <label>Message:</label><br>
            <textarea placeholder="Your message here..."></textarea><br>
            <button type="submit">Send Message</button>
        </form>
    </div>
</body>
</html>
