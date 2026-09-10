require('dotenv').config();

const mailsend = process.env.MAILSEND;
const pass = process.env.PASS;



const express = require("express");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");

const
	{
		MongoClient
	} = require("mongodb");
const
	{
		ObjectId
	} = require('mongodb');

const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require("path");
const cookieParser = require('cookie-parser');
const fs = require('fs');


const PORT = process.env.PORT;
const PAGINATION_LIMIT = parseInt(process.env.PAGINATION_LIMIT);


const app = express();



app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors())

app.use((err, req, res, next) => {
	if (err instanceof SyntaxError) {
		return res.status(400).send('Invalid JSON format. ');
	}
	next(err);
});

// const url = 'https://clascash.omarprojects.xyz'
const url = 'http://localhost:3000'
// const mongoURI = `mongodb://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOSTNAME}:${process.env.MONGO_PORT}/${process.env.CONNECTION_DATABASE}`;

const mongoURI = "mongodb://localhost:27017";
const dbName = "school";

let db;
let usersCollection, cardsCollection, transactionsCollection, stafflogsCollection;

MongoClient.connect(mongoURI,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then((client) => {
		db = client.db(dbName);
		usersCollection = db.collection("users");
		cardsCollection = db.collection("cards");
		transactionsCollection = db.collection("transactions");
		stafflogsCollection = db.collection("stafflogs");
		console.log("Connected to MongoDB");
	})
	.catch((error) => console.error(error));

const secret = process.env.SECRET;



async function authenticateUser(req, res, next) {
	const token = req.cookies.token
	if (!token) {
		const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
		const customized = html.replace('{{error}}', 'You are not currently logged in.');
		return res.status(403).send(customized);
	}
	try {

		const decoded = jwt.verify(token, secret);
		const user = await usersCollection.findOne(
			{
				email: decoded.email
			});
		if (!user) return res.status(401).json(
			{
				message: 'Invalid user'
			});
		req.user = user;
		next();
	}
	catch (err) {
		return res.status(403).json(
			{
				message: 'Invalid token'
			});
	}
}



const transporter = nodemailer.createTransport(
	{
		service: 'gmail',
		auth:
		{
			user: mailsend,
			pass: pass,
		},
	});


const sendemail = async (email, subject, text, html) => {
	try {
		await transporter.sendMail(
			{
				from: mailsend,
				to: email,
				subject: subject,
				text: text,
				html: html
			});
	}
	catch (err) {
		console.error(err);
	}
}

// Signin / Registration Routes


const serverStartTime = Date.now();

const uptime = () => {
	const now = Date.now();
	const diff = now - serverStartTime;

	const totalSeconds = Math.floor(diff / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${hours}H:${minutes}M:${seconds}S`;
};

app.get('/api/uptime', (req, res) => {
	res.json(
		{
			uptime: uptime(),
			timestamp: serverStartTime,
			message: 'Server is up and running'
		});
});


app.get('/verify-email', (req, res) => {
	const
		{
			token
		} = req.query;

	if (!token) {
		return res.status(400).send('Token is required');
	}

	jwt.verify(token, secret, async (err, decoded) => {
		if (err) {
			return res.sendFile(path.join(__dirname, 'public_pages/403.html'))
		}

		const user = await usersCollection.findOne(
			{
				email: decoded.email
			});
		if (!user) {
			return res.sendFile(path.join(__dirname, 'public_pages/404.html'))
		}

		await usersCollection.updateOne(
			{
				email: decoded.email
			},
			{
				$set:
				{
					verified: true
				}
			});

		return res.sendFile(path.join(__dirname, 'public_pages/home.html'))
	});
});



app.post('/api/signup', async (req, res) => {
	const { name, username, password, email, phone } = req.body;

	if (!name) return res.status(400).json({ message: 'Name is required.' });
	if (!username) return res.status(400).json({ message: 'Username is required.' });
	if (!password) return res.status(400).json({ message: 'Password is required.' });
	if (!email) return res.status(400).json({ message: 'Email is required.' });
	if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

	if (!/^\d{7,11}$/.test(phone)) {
		return res.status(400).json({ message: 'Phone must be 7-11 digits only.' });
	}
	const phonemodify = phone; 

	const userModify = name.trim();
	const usernameModify = username.trim().toLowerCase();
	const emailModify = email.trim().toLowerCase();

	if (usernameModify.length > 20 || !/^[a-zA-Z0-9]+$/.test(usernameModify)) {
		return res.status(400).json({
			message: 'Username must be 1-20 characters and only contain letters and numbers.'
		});
	}

	if (
		userModify.length === 0 ||
		userModify.length > 25 ||
		!/^[\p{L} ]+$/u.test(userModify)
	) {
		return res.status(400).json({
			message: 'Name must be 1-25 characters, letters and spaces only.'
		});
	}

	if (
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailModify)
	) {
		return res.status(400).json({ message: 'Invalid email address.' });
	}

	try {
		const user = await usersCollection.findOne({ username: usernameModify });
		const existingEmail = await usersCollection.findOne({ email: emailModify });
		const existingPhone = await usersCollection.findOne({ phone: phonemodify });

		if (user) return res.status(409).json({ message: 'Username is already in use.' });
		if (existingEmail) return res.status(409).json({ message: 'Email is already in use.' });
		if (existingPhone) return res.status(409).json({ message: 'Phone is already in use.' });

		if (userModify.toLowerCase() === password.toLowerCase()) {
			return res.status(409).json({ message: 'Name cannot be the same as password.' });
		}

		const hashedPassword = await bcryptjs.hash(password, 12);
		const authtoken = jwt.sign({ name: userModify.toLowerCase(), email: emailModify }, secret);

		const verificationToken = jwt.sign(
			{ name: userModify.toLowerCase(), email: emailModify },
			secret,
			{ expiresIn: '5m' }
		);

		const verificationLink = url + `/verify-email?token=${verificationToken}`;
	// 	await transporter.sendMail({
	// 		from: mailsend,
	// 		to: emailModify,
	// 		subject: 'ClassCash Email verification',
	// 		html: `
    //     <div style="font-family: Arial, sans-serif; color: #333; text-transform: capitalize;">
    //       Hello ${userModify},<br><br>
    //       Click the button below to verify your email:<br><br>
    //       <a href="${verificationLink}" style="
    //         display: inline-block;
    //         padding: 12px 20px;
    //         background-color: #3aa0e0;
    //         color: white;
    //         text-decoration: none;
    //         border-radius: 6px;
    //         font-weight: bold;
    //       ">Verify Email</a><br><br>
    //       If you didn't request this, you can ignore this email.
    //     </div>
    //   `
	// 	});

		const newUser = {
			name: userModify,
			username: usernameModify,
			email: emailModify,
			phone: phonemodify,
			role: 1, // Normal user
			verified: false,
			banned: false,
			password: hashedPassword
		};

		await usersCollection.insertOne(newUser);

		res.cookie('token', authtoken, {
			httpOnly: true,
			secure: true,
			sameSite: 'Strict',
			expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
		});

		res.status(201).json({
			message: 'User created successfully. Please check your email for verification.'
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'An unknown error occurred.' });
	}
});

app.post('/api/login', async (req, res) => {
	const
		{
			email,
			password
		} = req.body;
	if (!email || !password) {
		return res.status(400).json(
			{
				message: 'Missing password or email.'
			});
	}

	try {
		const user = await usersCollection.findOne(
			{
				email: email
			});
		if (!user) {
			return res.status(401).json(
				{
					message: 'Password or email incorrect.'
				});
		}

		bcryptjs.compare(password, user.password, (err, result) => {
			if (err) {
				return res.status(500).json(
					{
						message: 'An unknown error occurred.'
					});
			}

			if (!result) {
				return res.status(401).json(
					{
						message: 'Password or email incorrect.'
					});
			}

			const authtoken = jwt.sign(
				{
					name: user.name,
					email: user.email,
					role: user.role
				}, secret);
			res.cookie('token', authtoken,
				{
					httpOnly: true,
					secure: true,
					sameSite: 'Strict',
					expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days 
				});
			res.status(200).json(
				{
					message: 'Logged in successfully',
					name: user.name,
					email: user.email,
					role: user.role
				});
		});
	}
	catch (error) {
		return res.status(500).json(
			{
				message: 'An unknown error occurred.'
			});
	}
});

app.post('/api/verify', authenticateUser, async (req, res) => {
	const user = req.user
	const role = user.role;
	return res.status(200).json(
		{
			message: 'Verified successfully',
			role: role,
			name: user.name,
			verified: user.verified
		});
});

app.post('/api/createc', authenticateUser, async (req, res) => {
	const user = req.user
	const cardname = req.body.cardname

	if (!cardname) {
		return res.status(400).json(
			{
				message: 'Missing card name.'
			});
	}

	if (!/^[a-zA-Z]+(\s[a-zA-Z]+)?$/.test(cardname)) {
		return res.status(400).json(
			{
				message: "Card name must contain letters only and no more than one space"
			});
	}
	if (cardname.length > 10) {
		return res.status(400).json(
			{
				message: "Card name too long."
			});
	}

	if (user.verified == false) {
		return res.status(403).json(
			{
				message: 'You are not verified.'
			});
	}

	try {

		async function gencode() {
			const min = 1000000000;
			const max = 9999999999;
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		async function ucode() {
			let code;
			let codeExists = true;

			while (codeExists) {
				code = await gencode();
				const existingCard = await cardsCollection.findOne(
					{
						code: code
					});
				if (!existingCard) {
					codeExists = false;
				}
			}
			return code;
		}

		const generated = await ucode();
		const card = {
			oid: user._id,
			code: generated,
			cName: cardname,
			balance: 0,
			active: true
		};

		const cards = await cardsCollection.find(
			{
				oid: user._id
			}).toArray();
		if (cards.length >= 5) {
			return res.status(403).json(
				{
					message: 'Too many cards created.'
				});
		}

		await cardsCollection.insertOne(card);

		res.status(200).json(
			{
				message: 'Card created successfully',
				card
			});
	}
	catch (err) {
		return res.status(403).json(
			{
				message: 'Unkown error occurred'
			});
	}
});

// Transactions Routes

app.post('/api/purchase', authenticateUser, async (req, res) => {
	const
		{
			code,
			amount
		} = req.body;


	if (!code || !amount) return res.status(400).json(
		{
			message: 'Invalid input'
		});

	const rcode = parseFloat(code);
	const ramount = parseFloat(amount);
	const user = req.user
	if (isNaN(rcode) || isNaN(ramount) || ramount <= 0) {
		return res.status(400).json(
			{
				message: 'Invalid code or amount'
			});
	}

	try {



		if (!user) return res.status(401).json(
			{
				message: 'User not found'
			});
		if (user.role < 3) {
			return res.status(403).json(
				{
					message: 'You are not authorized to perform this action'
				});
		}

		const card = await cardsCollection.findOne(
			{
				code: rcode
			});
		if (!card) return res.status(401).json(
			{
				message: 'Card is invalid'
			});

		if (card.active == false) {
			return res.status(403).json(
				{
					message: 'Card is inactive'
				});
		}
		if (ramount > 20 || ramount < 1) {
			return res.status(403).json(
				{
					message: 'Purchase amount must be between 1 SAR and 20 SAR.'
				});
		}
		const current_balance = card.balance;

		if (current_balance < ramount) {
			const transaction = {
				oid: card.oid,
				amount: ramount,
				card: rcode,
				newBal: current_balance,
				oldBal: current_balance,
				cName: card.cName,
				type: "DEBIT",
				status: "FAILED",
				cardID: card._id,
				date: new Date().toISOString()
			}
			await transactionsCollection.insertOne(transaction);
			sendemail(
				user.email,
				"Purchase Failed: Insufficient Funds",
				undefined,
				`
       <div style="font-family: Arial, sans-serif; color: #333;">
  <h2>Purchase Declined</h2>
  <p>A purchase using the '<strong>${card.cName}</strong>' Card was declined on a transaction of <strong>${ramount} SAR</strong> due to <strong>insufficient funds</strong>.</p>
  <p>The attempt was made using a card ending in <strong>******${rcode.toString().slice(-4)}</strong>.</p>
  <p>Current balance: <strong>${card.balance} SAR</strong>.</p>
  <p>Please ensure the card has sufficient balance for future transactions.</p>
  <br>
    <p>This is an automated confirmation for record-keeping purposes.</p>
  <br>
  <p>— ClassCash Team</p>
</div>
        `
			);
			return res.status(403).json(
				{
					message: 'Insufficient balance'
				});
		}





		const transaction = {
			oid: card.oid,
			amount: ramount,
			card: rcode,
			newBal: current_balance - ramount,
			oldBal: current_balance,
			cName: card.cName,
			type: "DEBIT",
			status: "SUCCESS",
			cardID: card._id,


			date: new Date().toISOString() // saves in utc times, to convert to ast (gmt+ 3 ) just add 3 hours
		}

		await transactionsCollection.insertOne(transaction);
		await cardsCollection.updateOne(
			{
				code: rcode
			},
			{
				$set:
				{
					balance: card.balance - ramount
				}
			});

		sendemail(
			user.email,
			"Successful Purchase",
			undefined,
			`
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2>Purchase Successful</h2>
  <p>A purchase of <strong>${ramount} SAR</strong> using the '<strong>${card.cName}</strong>' Card was successfully completed.</p>
    <p>The attempt was made using a card ending in <strong>******${rcode.toString().slice(-4)}</strong>.</p>
  <p>Remaining balance: <strong>${card.balance - ramount} SAR</strong>.</p>
  <p>This is an automated confirmation for record-keeping purposes.</p>
  <br>
  <p>— ClassCash Team</p>
</div>

  `
		);
		return res.status(200).json(
			{
				message: `${ramount} SAR was debited from ${rcode} successfully. Current balance: ${card.balance - ramount} SAR`
			});

	}
	catch (err) {
		console.log(err)
		return res.status(403).json(
			{
				message: 'Failed to debit amount'
			});
	}
});

app.post('/api/top-up', authenticateUser, async (req, res) => {

	const
		{
			code,
			amount,
			reason
		} = req.body;



	if (!code || !amount) return res.status(400).json(
		{
			message: 'Invalid input'
		});

	const rcode = parseFloat(code);
	const ramount = parseFloat(amount);
	const user = req.user

	if (isNaN(rcode) || isNaN(ramount) || ramount <= 0) {
		return res.status(400).json(
			{
				message: 'Invalid code or amount'
			});
	}

	try {





		if (user.role < 4) {
			return res.status(403).json(
				{
					message: 'You are not authorized to perform this action'
				});
		}

		if (!user) return res.status(401).json(
			{
				message: 'User not found'
			});

		const card = await cardsCollection.findOne(
			{
				code: rcode
			});
		if (!card) return res.status(401).json(
			{
				message: 'Card is invalid'
			});

		if (card.active == false) {
			return res.status(403).json(
				{
					message: 'Card is inactive'
				});
		}

		if (ramount < 5 || ramount > 500) {
			return res.status(403).json(
				{
					message: 'Top-up amount must be between 5 and 100.'
				});
		}

		const current_balance = card.balance;




		const transaction = {
			oid: card.oid,
			amount: ramount,
			card: rcode,
			newBal: current_balance + ramount,
			oldBal: current_balance,
			type: "CREDIT",
			status: "SUCCES",
			aid: user._id,
			reason: reason || "No reason provided",

			date: new Date().toISOString()
		}
		const normtransaction = {
			oid: card.oid,
			amount: ramount,
			card: rcode,
			newBal: current_balance + ramount,
			oldBal: current_balance,
			cName: card.cName,
			type: "CREDIT",
			status: "SUCCES",
			reason: reason || "No reason provided",
			date: new Date().toISOString()
		}
		await cardsCollection.updateOne(
			{
				code: rcode
			},
			{
				$set:
				{
					balance: card.balance + ramount
				}
			});
		await stafflogsCollection.insertOne(transaction);
		await transactionsCollection.insertOne(normtransaction);
		return res.status(200).json(
			{
				message: `${ramount} was added to ${rcode} successfully. Current balance: ${card.balance + ramount}`
			});

	}
	catch (err) {
		return res.status(403).json(
			{
				message: 'Unknown error occurred'
			});
	}
});


// Card / Wallet Routes


app.get('/api/card-info', authenticateUser, async (req, res) => {
	const code = req.body.code
	const user = req.user

	if (!code) return res.status(400).json(
		{
			message: 'Invalid input'
		});
	const rcode = parseFloat(code);

	if (isNaN(rcode)) {
		return res.status(400).json(
			{
				message: 'Invalid code'
			});
	}

	try {



		if (!user) return res.status(401).json(
			{
				message: 'User not found'
			});

		const card = await cardsCollection.findOne(
			{
				code: rcode
			});
		if (!card) return res.status(401).json(
			{
				message: 'Card is invalid'
			});

		if (user.role < 4) {

			const returninfo = {
				code: card.code,
				id: card._id,
				balance: card.balance,
				status: card,
				cName: card.cName,
			}
			return res.status(200).json(
				{
					message: returninfo
				});
		}

		const prevtransactions =
			await transactionsCollection
				.find(
					{
						card: rcode
					})
				.sort(
					{
						date: -1
					})
				.limit(5)
				.toArray();

		return res.status(200).json(
			{
				message: card,
				transactions: prevtransactions
			});




	}
	catch (err) {
		return res.status(403).json(
			{
				message: 'Unknown error occurred'
			});
	}
});

app.post('/api/card-status', authenticateUser, async (req, res) => {
	const
		{
			code,
			reason
		} = req.body


	const user = req.user
	if (!code) return res.status(400).json(
		{
			message: 'Invalid input'
		});

	const rcode = parseFloat(code);

	if (isNaN(rcode)) {
		return res.status(400).json(
			{
				message: 'Invalid code'
			});
	}

	try {




		if (!user) return res.status(401).json(
			{
				message: 'User not found'
			});

		const card = await cardsCollection.findOne(
			{
				code: rcode
			});
		if (!card) return res.status(401).json(
			{
				message: 'Card is invalid'
			});

		if (user.role < 3) {

			if (card.oid.toString() == user._id.toString()) {


				const recent = await transactionsCollection.findOne(
					{
						oid: new ObjectId(user._id),
						card: rcode,
						type: "STATUS_CHANGE",
						date:
						{
							$exists: true
						},
						$expr:
						{
							$gte: [
								{
									$toDate: "$date"
								},
								new Date(Date.now() - 10 * 60 * 1000)
							]
						}

					});

				if (recent) {
					const waitMinutes = 10;
					const now = Date.now();
					const nextAllowed = new Date(recent.date).getTime() + waitMinutes * 60 * 1000;
					const minutesLeft = Math.ceil((nextAllowed - now) / 60000);

					return res.status(429).json(
						{
							message: `Please try again in ${minutesLeft} minute(s).`
						});
				}




				const transaction = {
					oid: card.oid,
					card: rcode,
					type: "STATUS_CHANGE",
					status: "SUCCES",
					cName: card.cName,
					prev: card.active,
					next: !card.active,
					reason: "User changed status.",

					date: new Date().toISOString()
				}
				await cardsCollection.updateOne(
					{
						code: rcode
					},
					{
						$set:
						{
							active: !card.active
						}
					});
				await transactionsCollection.insertOne(transaction);

				return res.status(200).json(
					{
						message: `Changed ${rcode} status successfully. Card is now ${card.active ? "inactive" : "active"}`
					});

			}
			else {
				return res.status(403).json(
					{
						message: 'You are not authorized to perform this action'
					});
			}
		}





		const transaction = {
			oid: card.oid,
			card: rcode,
			type: "STATUS_CHANGE",
			status: "SUCCES",
			prev: card.active,
			next: !card.active,
			aid: user._id,
			reason: reason,

			date: new Date().toISOString()
		}
		const normtransaction = {
			oid: card.oid,
			card: rcode,
			type: "STATUS_CHANGE",
			status: "SUCCES",
			cName: card.cName,
			prev: card.active,
			next: !card.active,
			reason: reason,

			date: new Date().toISOString()
		}


		await cardsCollection.updateOne(
			{
				code: rcode
			},
			{
				$set:
				{
					active: !card.active
				}
			});
		await stafflogsCollection.insertOne(transaction);
		await transactionsCollection.insertOne(normtransaction);

		return res.status(200).json(
			{
				message: `Changed ${rcode} status successfully. Card is now ${card.active ? "inactive" : "active"}`
			});



	}
	catch (err) {
		console.log(err)
		return res.status(403).json(
			{
				message: 'Failed to edit status or failed to verify token'
			});
	}
});

app.post('/api/card-status-ID', authenticateUser, async (req, res) => {
	const
		{
			id,
			reason
		} = req.body


	const user = req.user
	if (!id) return res.status(400).json(
		{
			message: 'Invalid input'
		});


	try {




		if (!user) return res.status(401).json(
			{
				message: 'User not found'
			});

		if (!ObjectId.isValid(id)) {
			return res.status(400).json({ message: 'Invalid ID format' });
		}

		const card = await cardsCollection.findOne(
			{
				_id: new ObjectId(id)
			});
		if (!card) return res.status(401).json(
			{
				message: 'Card is invalid'
			});

		if (user.role < 3) {

			if (card.oid.toString() == user._id.toString()) {

				const recent = await transactionsCollection.findOne(
					{
						oid: new ObjectId(user._id),
						card: card.code,
						type: "STATUS_CHANGE",
						date:
						{
							$exists: true
						},
						$expr:
						{
							$gte: [
								{
									$toDate: "$date"
								},
								new Date(Date.now() - 10 * 60 * 1000)
							]
						}

					});

				if (recent) {
					const waitMinutes = 10;
					const now = Date.now();
					const nextAllowed = new Date(recent.date).getTime() + waitMinutes * 60 * 1000;
					const minutesLeft = Math.ceil((nextAllowed - now) / 60000);

					return res.status(429).json(
						{
							message: `Please try again in ${minutesLeft} minute(s).`
						});
				}



				const transaction = {
					oid: card.oid,
					card: card.code,
					type: "STATUS_CHANGE",
					status: "SUCCES",
					cName: card.cName,
					prev: card.active,
					next: !card.active,
					reason: "User changed status.",

					date: new Date().toISOString()
				}
				await cardsCollection.updateOne(
					{
						_id: new ObjectId(id)
					},
					{
						$set:
						{
							active: !card.active
						}
					});
				await transactionsCollection.insertOne(transaction);

				return res.status(200).json(
					{
						message: `Changed ${id} status successfully. Card is now ${card.active ? "inactive" : "active"}`
					});

			}
			else {
				return res.status(403).json(
					{
						message: 'You are not authorized to perform this action'
					});
			}
		}





		const transaction = {
			oid: card.oid,
			card: card.code,
			type: "STATUS_CHANGE",
			status: "SUCCES",
			prev: card.active,
			next: !card.active,
			aid: user._id,
			reason: reason,

			date: new Date().toISOString()
		}
		const normtransaction = {
			oid: card.oid,
			card: card.code,
			type: "STATUS_CHANGE",
			status: "SUCCES",
			cName: card.cName,
			prev: card.active,
			next: !card.active,
			reason: reason,

			date: new Date().toISOString()
		}


		await cardsCollection.updateOne(
			{
				_id: new ObjectId(id)
			},
			{
				$set:
				{
					active: !card.active
				}
			});
		await stafflogsCollection.insertOne(transaction);
		await transactionsCollection.insertOne(normtransaction);

		return res.status(200).json(
			{
				message: `Changed ${id} status successfully. Card is now ${card.active ? "inactive" : "active"}`
			});



	}
	catch (err) {
		return res.status(403).json(
			{
				message: 'Failed to edit status or failed to verify token'
			});
	}
});


app.get('/api/wallet-info', authenticateUser, async (req, res) => {
	const
		{
			code,
			id
		} = req.query ||
			{
				code: null,
				id: null
			};
	const user = req.user

	try {


		if (user.role < 3) {
			const cards = await cardsCollection.find(
				{
					oid: new ObjectId(user._id)
				}).sort(
					{
						date: -1
					})
				.project(
					{
						balance: 1,
						code: 1,
						cName: 1,
						active: 1,
						_id: 1
					})
				.toArray();
			const sanitized = cards.map(tx => (
				{
					balance: tx.balance,
					cName: tx.cName,
					active: tx.active,
					_id: tx._id.toString(),
					code: tx.code.toString()
				}));
			return res.status(200).json(sanitized);
		}


		if (!code && !id) {
			const cards = await cardsCollection.find(
				{
					oid: user._id
				}).toArray();
			return res.status(200).json(cards);
		}

		if (code && id && code != null && id != null) {
			return res.status(403).json(
				{
					message: 'Cannot enter both inputs.'
				});
		}


		// Check via code
		if (code) {
			const rcode = parseFloat(code);
			if (isNaN(rcode)) {
				return res.status(403).json(
					{
						message: 'Invalid code'
					});
			}

			const card = await cardsCollection.findOne(
				{
					code: rcode
				});
			if (!card) {
				return res.status(403).json(
					{
						message: 'Card not found'
					});
			}



			const cards = await cardsCollection.find(
				{
					oid: card.oid
				}).toArray();
			const owner = await usersCollection.findOne(
				{
					_id: card.oid
				});

			if (!owner) {
				return res.status(403).json(
					{
						message: 'User ID not found'
					});
			}
			// Fetches owner data

			const ownerdata = {
				name: owner.name,
				username: owner.username,
				email: owner.email,
				phone: owner.phone,
				role: owner.role,
				verified: owner.verified,
				_id: owner._id
			}
			return res.status(200).json(
				{
					cards: cards,
					owner: ownerdata
				})
		}


		// Checks via ID
		if (id) {


			if (!ObjectId.isValid(id)) {
				return res.status(400).json({ message: 'Invalid ID format' });
			}
			const card = await cardsCollection.findOne(
				{
					_id: new ObjectId(id)
				});
			if (!card) {
				return res.status(403).json(
					{
						message: 'Card not found'
					});
			}



			const cards = await cardsCollection.find(
				{
					oid: card.oid
				}).toArray();
			const owner = await usersCollection.findOne(
				{
					_id: card.oid
				});

			if (!owner) {
				return res.status(403).json(
					{
						message: 'User ID not found'
					});
			}

			const ownerdata = {
				name: owner.name,
				username: owner.username,
				email: owner.email,
				phone: owner.phone,
				role: owner.role,
				verified: owner.verified,
				_id: owner._id
			}
			return res.status(200).json(
				{
					cards: cards,
					owner: ownerdata
				})
		}



	}
	catch (err) {
		console.log(err)
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}
});

app.get('/api/owner-info', authenticateUser, async (req, res) => {
	const
		{
			code,
			id
		} = req.body ||
			{
				code: null,
				id: null
			};
	const user = req.user




	try {


		if (user.role < 3) {
			const sanitized = {
				name: user.name,
				role: user.role,
				verified: user.verified,
				_id: user._id
			}
			return res.status(200).json(
				{
					message: sanitized
				})
		}



		if (!code && !id) {

			const sanitized = {
				name: user.name,
				role: user.role,
				verified: user.verified,
				_id: user._id
			}
			return res.status(200).json(
				{
					message: sanitized
				})
		}

		if (code && id && code != null && id != null) {
			return res.status(403).json(
				{
					message: 'Cannot enter both inputs.'
				});
		}

		if (code) {
			const rcode = parseFloat(code);
			if (isNaN(rcode)) {
				return res.status(403).json(
					{
						message: 'Invalid code'
					});
			}

			const card = await cardsCollection.findOne(
				{
					code: rcode
				});
			if (!card) {
				return res.status(403).json(
					{
						message: 'Card not found'
					});
			}


			const owner = await usersCollection.findOne(
				{
					_id: card.oid
				});


			const sanitized = {
				name: owner.name,
				email: owner.email,
				phone: owner.phone,
				role: owner.role,
				verified: owner.verified,
				_id: owner._id
			}
			return res.status(200).json(
				{
					message: sanitized
				})
		}

		if (id) {

			if (!ObjectId.isValid(id)) {
				return res.status(400).json({ message: 'Invalid ID format' });
			}

			const owner = await usersCollection.findOne(
				{
					_id: new ObjectId(id)
				}); // I have no idea why this works, but it does. DO NOT TOUCH.

			if (!owner) {
				return res.status(403).json(
					{
						message: 'User ID not found'
					});
			}

			const sanitized = {
				name: owner.name,
				email: owner.email,
				phone: owner.phone,
				role: owner.role,
				verified: owner.verified,
				_id: owner._id
			}
			return res.status(200).json(
				{
					message: sanitized
				})
		}



	}
	catch (err) {
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}
});

app.get('/api/transactions', authenticateUser, async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const { code } = req.body;
	const user = req.user

	const skip = (page - 1) * PAGINATION_LIMIT;



	if (!code) return res.status(400).json(
		{
			message: 'Invalid input'
		});
	const rcode = parseFloat(code);

	if (isNaN(rcode)) {
		return res.status(400).json(
			{
				message: 'Invalid code'
			});
	}

	try {
		if (!user) return res.status(401).json(
			{
				message: 'User not found'
			});

		const card = await cardsCollection.findOne(
			{
				code: rcode
			});
		if (!card) {
			return res.status(403).json(
				{
					message: 'Card not found'
				});
		}
		const transactions = await transactionsCollection.find(
			{
				cardID: card._id
			}).sort(
				{
					date: -1
				})
			.skip(skip)
			.limit(PAGINATION_LIMIT)

			.toArray();

		const sanitized = transactions.map(tx => (
			{
				newBal: tx.newBal,
				amount: tx.amount,
				type: tx.type,
				status: tx.status,
				cName: tx.cName,
				card: tx.card,
				date: tx.date,
				_id: tx._id
			}))

		return res.status(200).json(
			{
				message: sanitized,
				total: await transactionsCollection.countDocuments(
					{
						cardID: card._id
					}),
				current: page

			})
	}
	catch (err) {
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}


})

app.get('/api/transactions-param', authenticateUser, async (req, res) => {
	let { card, page } = req.query;
	const user = req.user

	if (!page) {
		page = 1
	}
	if (!card) return res.status(400).json(
		{
			message: 'Invalid input'
		});

	page = parseInt(page);

	const skip = (page - 1) * PAGINATION_LIMIT;

	try {
		if (!user) return res.status(401).json(
			{
				message: 'User not found'
			});

		if (!ObjectId.isValid(card)) {
			return res.status(400).json({ message: 'Invalid ID format' });
		}

		const cardobj = new ObjectId(card)
		const cardItem = (await cardsCollection.findOne(
			{
				_id: cardobj
			}))




		let cardDoc = await cardsCollection.findOne(
			{
				_id: new ObjectId(card),
				oid: user._id
			})


		if (user.role >= 3) {
			console.log('admin')
			cardDoc = await cardsCollection.findOne(
				{
					_id: new ObjectId(card)
				})
		}

		if (!cardDoc) {
			return res.status(403).json(
				{
					message: 'Card not found or does not belong to user', cardDoc, card
				});
		}

		const transactions = (await transactionsCollection.find(
			{
				card: cardItem.code,
				type:
				{
					$ne: "STATUS_CHANGE"
				}
			}).sort(
				{
					date: -1
				})
			.skip(skip)
			.limit(PAGINATION_LIMIT)

			.toArray());


		if (transactions.length == 0) {
			return res.status(403).json(
				{
					message: 'No transactions found for this card.'
				});
		}

		const sanitized = transactions.map(tx => (
			{
				newBal: tx.newBal,
				amount: tx.amount,
				type: tx.type,
				status: tx.status,
				cName: tx.cName,
				card: tx.card,
				date: tx.date,
				_id: tx._id
			}))

		return res.status(200).json(
			{
				message: sanitized,
				user: user.name,
				total: await transactionsCollection.countDocuments(
					{
						card: cardItem.code
					}),
				current: page,
				limit: PAGINATION_LIMIT

			})

	}
	catch (err) {
		console.log(err)
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}


})

app.get('/api/recent-transactions', authenticateUser, async (req, res) => {
	const user = req.user



	try {
		if (!user) return res.status(401).json(
			{
				message: 'User not found'
			})

		if (!ObjectId.isValid(user._id)) {
			return res.status(400).json({ message: 'Invalid ID format' });
		}

		const transactions = await transactionsCollection.find(
			{
				oid: new ObjectId(user._id),
				status:
				{
					$ne: "FAILED"
				},
				type:
				{
					$ne: "STATUS_CHANGE"
				}
			}).sort(
				{
					date: -1
				})
			.limit(15)
			.project(
				{
					newBal: 1,
					date: 1,
					amount: 1,
					type: 1,
					status: 1,
					cName: 1,
					card: 1,
					_id: 0
				})
			.sort(
				{
					date: -1
				})
			.toArray();

		const sanitized = transactions.map(tx => (
			{
				newBal: tx.newBal,
				date: tx.date,
				amount: tx.amount,
				type: tx.type,
				status: tx.status,
				cName: tx.cName,
				card: tx.card.toString().slice(-4)
			}));

		if (transactions.length === 0) {
			return res.status(404).json(
				{
					message: 'No transactions found'
				});
		}
		return res.status(200).json(
			{
				message: sanitized
			})
	}
	catch (err) {
		console.log(err)
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}


})


app.post('/api/manage-role', authenticateUser, async (req, res) => {
	if (!req.body) return res.status(400).json({ message: "Missing body" });


	const user = req.user
	const UIDToEdit = req.body.UID || null
	const role = req.body.role


	if (!role) return res.status(400).json({ message: "Missing role" })
	const value = parseInt(role);
	if (isNaN(value)) return res.status(400).json({ message: "Invalid value" });
	if (value < 0 || value >= 4) return res.status(400).json({ message: "Invalid role range" });



	if (!UIDToEdit) return res.status(400).json({ message: "Missing UID" })

	if (!ObjectId.isValid(UIDToEdit)) {
		return res.status(400).json({ message: 'Invalid ID format' });
	}

	const userToEdit = await usersCollection.findOne(
		{
			_id: new ObjectId(UIDToEdit)
		}
	)

	if (!userToEdit) return res.status(404).json(
		{
			message: 'User not found'
		});



	try {
		if (user.role < 3) {
			return res.status(403).json({ message: "Insufficient permission" })
		}

		if (!value) return res.status(400).json({ message: "Missing value" })
		if (value < 0 || value >= 4) return res.status(400).json({ message: "Invalid value" })


		if (userToEdit.id == req.user.id) return res.status(400).json({ message: "Cannot manage your own role" });
		if (userToEdit.role === value) return res.status(400).json({ message: "User already has this role" });
		if (userToEdit.role >= req.user.role) return res.status(400).json({ message: "Cannot manage roles for users with equal or higher role" });

		await usersCollection.updateOne(
			{
				_id: new ObjectId(UIDToEdit)
			},
			{
				$set:
				{
					role: value
				}
			})
		let roleName;

		if (value === 1) roleName = "Normaluser";
		else if (value === 2) roleName = "Staff";
		else if (value === 3) roleName = "Admin";
		else if (value === 4) roleName = "Super Admin";
		else roleName = "Unknown role";

		return res.status(200).json({ message: "User has been given the role of " + roleName });



	} catch (e) {
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}

});

// Pages

// Private Pages

app.get('/admin', authenticateUser, async (req, res) => {



	const user = req.user;


	try {
		if (user.role < 3) {
			const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
			const customized = html.replace('{{error}}', 'You are not allowed to access this page');
			return res.send(customized);
		}

		res.sendFile(path.join(__dirname, 'private/admin.html'));
	}
	catch (err) {
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}
});

// Private Admin Subpages

app.get('/purchase', authenticateUser, async (req, res) => {



	const user = req.user;


	try {
		if (user.role < 2) {
			const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
			const customized = html.replace('{{error}}', 'You are not allowed to access this page');
			return res.send(customized);
		}
		res.sendFile(path.join(__dirname, 'private/purchase.html'));
	}
	catch (err) {
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}
});

app.get('/admin/wallet', authenticateUser, async (req, res) => {



	const user = req.user;


	try {
		if (user.role < 3) {
			const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
			const customized = html.replace('{{error}}', 'You are not allowed to access this page');
			return res.send(customized);
		}
		res.sendFile(path.join(__dirname, 'private/wallet-info.html'));
	}
	catch (err) {
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}
});

// Misc Private Pages

app.get('/verified', authenticateUser, async (req, res) => {



	const user = req.user;


	try {

		if (user.verified == true) {
			const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
			const customized = html.replace('{{error}}', 'You are already verified');
			return res.send(customized);
		}


		res.sendFile(path.join(__dirname, 'private/verified.html'));
	}
	catch (err) {
		return res.status(500).json(
			{
				message: 'Unknown error occurred'
			});
	}
});



// Related files



// JS
app.get('/private/purchase.js', authenticateUser, (req, res) => {
	if (req.user.role < 2) {
		const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
		const customized = html.replace('{{error}}', 'You are not allowed to access this page');
		return res.send(customized);
	}
	res.sendFile(path.join(__dirname, 'private/scripts/purchase.js'));
});

app.get('/private/wallet-info.js', authenticateUser, (req, res) => {
	if (req.user.role < 3) {
		const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
		const customized = html.replace('{{error}}', 'You are not allowed to access this page');
		return res.send(customized);
	}
	res.sendFile(path.join(__dirname, 'private/scripts/wallet-info.js'));
});

// CSS

app.get('/private/admin.css', authenticateUser, (req, res) => {
	if (req.user.role < 3) {
		const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
		const customized = html.replace('{{error}}', 'You are not allowed to access this page');
		return res.send(customized);
	} res.sendFile(path.join(__dirname, 'private/styles/admins.css'));
});

app.get('/private/purchase.css', authenticateUser, (req, res) => {
	if (req.user.role < 2) {
		const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
		const customized = html.replace('{{error}}', 'You are not allowed to access this page');
		return res.send(customized);

	} res.sendFile(path.join(__dirname, 'private/styles/purchase.css'));
});

app.get('/private/wallet-info.css', authenticateUser, (req, res) => {
	if (req.user.role < 2) {
		const html = fs.readFileSync(path.join(__dirname, 'public_pages/403.html'), 'utf8');
		const customized = html.replace('{{error}}', 'You are not allowed to access this page');
		return res.send(customized);

	} res.sendFile(path.join(__dirname, 'private/styles/wallet-info.css'));
});







// Public Pages


app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public_pages/index.html'))
});
app.get('/tos', (req, res) => {
	res.sendFile(path.join(__dirname, 'public_pages/tos.html'))
});
app.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname, 'public_pages/login.html'))
});
app.get('/home', (req, res) => {
	res.sendFile(path.join(__dirname, 'public_pages/home.html'))
});
app.get('/wallet', (req, res) => {
	res.sendFile(path.join(__dirname, 'public_pages/wallet.html'))
});
app.get('/transactions', (req, res) => {
	res.sendFile(path.join(__dirname, 'public_pages/transactions.html'))
});
app.get('/create', (req, res) => {
	res.sendFile(path.join(__dirname, 'public_pages/createcard.html'))
});

app.get('/logout', (req, res) => {
	res.clearCookie('token', {
		httpOnly: true,
		secure: true,
		sameSite: 'Strict',
		path: '/',
	});
	res.redirect('/login');
});






app.use((req, res) => {
	res.status(404).sendFile(path.join(__dirname, 'public_pages/404.html'))
});
app.listen(PORT, () => {
	console.log(`Server is running on port  http://localhost:${PORT}`);
});