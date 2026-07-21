/* ============================================
   seedBooks.js - Seeds 100 Books into MongoDB
   Run: npm run seed:books
   ============================================ */
require('dotenv').config();
const mongoose  = require('mongoose');
const Book      = require('./models/Book');
const connectDB = require('./config/db');

/* ── 100 Realistic Engineering College Library Books ── */
const books = [
  /* ─── Programming ─────────────────────────── */
  { bookId: "BK001", name: "The C Programming Language", author: "Brian W. Kernighan & Dennis M. Ritchie", category: "Programming", quantity: 12, availableQuantity: 12 },
  { bookId: "BK002", name: "Let Us C", author: "Yashavant Kanetkar", category: "Programming", quantity: 15, availableQuantity: 15 },
  { bookId: "BK003", name: "Programming in ANSI C", author: "E. Balagurusamy", category: "Programming", quantity: 14, availableQuantity: 14 },
  { bookId: "BK004", name: "Introduction to Java Programming", author: "Y. Daniel Liang", category: "Programming", quantity: 10, availableQuantity: 10 },
  { bookId: "BK005", name: "Head First Java", author: "Kathy Sierra & Bert Bates", category: "Programming", quantity: 8, availableQuantity: 8 },
  { bookId: "BK006", name: "Python Crash Course", author: "Eric Matthes", category: "Programming", quantity: 10, availableQuantity: 10 },
  { bookId: "BK007", name: "Clean Code: A Handbook of Agile Software Craftsmanship", author: "Robert C. Martin", category: "Programming", quantity: 6, availableQuantity: 6 },
  { bookId: "BK008", name: "C++ Programming: From Problem Analysis to Program Design", author: "D.S. Malik", category: "Programming", quantity: 9, availableQuantity: 9 },
  { bookId: "BK009", name: "JavaScript: The Good Parts", author: "Douglas Crockford", category: "Programming", quantity: 7, availableQuantity: 7 },
  { bookId: "BK010", name: "The Pragmatic Programmer", author: "Andrew Hunt & David Thomas", category: "Programming", quantity: 5, availableQuantity: 5 },

  /* ─── Data Structures ──────────────────────── */
  { bookId: "BK011", name: "Data Structures Using C", author: "Reema Thareja", category: "Data Structures", quantity: 15, availableQuantity: 15 },
  { bookId: "BK012", name: "Data Structures and Algorithms Made Easy", author: "Narasimha Karumanchi", category: "Data Structures", quantity: 13, availableQuantity: 13 },
  { bookId: "BK013", name: "Data Structures and Algorithm Analysis in C", author: "Mark Allen Weiss", category: "Data Structures", quantity: 8, availableQuantity: 8 },
  { bookId: "BK014", name: "Data Structures and Algorithms in Java", author: "Robert Lafore", category: "Data Structures", quantity: 7, availableQuantity: 7 },
  { bookId: "BK015", name: "Fundamentals of Data Structures in C", author: "Ellis Horowitz & Sartaj Sahni", category: "Data Structures", quantity: 10, availableQuantity: 10 },
  { bookId: "BK016", name: "Data Structures: A Pseudocode Approach with C", author: "Richard F. Gilberg", category: "Data Structures", quantity: 6, availableQuantity: 6 },
  { bookId: "BK017", name: "Data Structures and Algorithms", author: "Alfred V. Aho, John E. Hopcroft", category: "Data Structures", quantity: 5, availableQuantity: 5 },

  /* ─── Algorithms ───────────────────────────── */
  { bookId: "BK018", name: "Introduction to Algorithms", author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein", category: "Algorithms", quantity: 12, availableQuantity: 12 },
  { bookId: "BK019", name: "Algorithms", author: "Robert Sedgewick & Kevin Wayne", category: "Algorithms", quantity: 8, availableQuantity: 8 },
  { bookId: "BK020", name: "The Algorithm Design Manual", author: "Steven S. Skiena", category: "Algorithms", quantity: 6, availableQuantity: 6 },
  { bookId: "BK021", name: "Algorithm Design", author: "Jon Kleinberg & Eva Tardos", category: "Algorithms", quantity: 7, availableQuantity: 7 },
  { bookId: "BK022", name: "Grokking Algorithms", author: "Aditya Y. Bhargava", category: "Algorithms", quantity: 10, availableQuantity: 10 },
  { bookId: "BK023", name: "Algorithms Unlocked", author: "Thomas H. Cormen", category: "Algorithms", quantity: 5, availableQuantity: 5 },

  /* ─── Database ─────────────────────────────── */
  { bookId: "BK024", name: "Database System Concepts", author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan", category: "Database", quantity: 12, availableQuantity: 12 },
  { bookId: "BK025", name: "Fundamentals of Database Systems", author: "Ramez Elmasri & Shamkant B. Navathe", category: "Database", quantity: 10, availableQuantity: 10 },
  { bookId: "BK026", name: "Database Management Systems", author: "Raghu Ramakrishnan & Johannes Gehrke", category: "Database", quantity: 9, availableQuantity: 9 },
  { bookId: "BK027", name: "An Introduction to Database Systems", author: "C.J. Date", category: "Database", quantity: 7, availableQuantity: 7 },
  { bookId: "BK028", name: "SQL: The Complete Reference", author: "James R. Groff & Paul N. Weinberg", category: "Database", quantity: 8, availableQuantity: 8 },
  { bookId: "BK029", name: "MySQL: The Definitive Guide", author: "Michael Kofler", category: "Database", quantity: 6, availableQuantity: 6 },

  /* ─── Operating Systems ────────────────────── */
  { bookId: "BK030", name: "Operating System Concepts", author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne", category: "Operating Systems", quantity: 13, availableQuantity: 13 },
  { bookId: "BK031", name: "Modern Operating Systems", author: "Andrew S. Tanenbaum & Herbert Bos", category: "Operating Systems", quantity: 10, availableQuantity: 10 },
  { bookId: "BK032", name: "Operating Systems: Internals and Design Principles", author: "William Stallings", category: "Operating Systems", quantity: 8, availableQuantity: 8 },
  { bookId: "BK033", name: "Understanding the Linux Kernel", author: "Daniel P. Bovet & Marco Cesati", category: "Operating Systems", quantity: 5, availableQuantity: 5 },
  { bookId: "BK034", name: "The Design of the UNIX Operating System", author: "Maurice J. Bach", category: "Operating Systems", quantity: 6, availableQuantity: 6 },
  { bookId: "BK035", name: "Operating Systems: Three Easy Pieces", author: "Remzi H. Arpaci-Dusseau & Andrea C. Arpaci-Dusseau", category: "Operating Systems", quantity: 7, availableQuantity: 7 },

  /* ─── Computer Networks ────────────────────── */
  { bookId: "BK036", name: "Computer Networks", author: "Andrew S. Tanenbaum & David J. Wetherall", category: "Computer Networks", quantity: 12, availableQuantity: 12 },
  { bookId: "BK037", name: "Data Communications and Networking", author: "Behrouz A. Forouzan", category: "Computer Networks", quantity: 13, availableQuantity: 13 },
  { bookId: "BK038", name: "Computer Networking: A Top-Down Approach", author: "James F. Kurose & Keith W. Ross", category: "Computer Networks", quantity: 10, availableQuantity: 10 },
  { bookId: "BK039", name: "TCP/IP Illustrated, Volume 1", author: "W. Richard Stevens", category: "Computer Networks", quantity: 6, availableQuantity: 6 },
  { bookId: "BK040", name: "Network Security Essentials", author: "William Stallings", category: "Computer Networks", quantity: 7, availableQuantity: 7 },
  { bookId: "BK041", name: "Computer Networks: A Systems Approach", author: "Larry L. Peterson & Bruce S. Davie", category: "Computer Networks", quantity: 5, availableQuantity: 5 },

  /* ─── Software Engineering ─────────────────── */
  { bookId: "BK042", name: "Software Engineering", author: "Ian Sommerville", category: "Software Engineering", quantity: 11, availableQuantity: 11 },
  { bookId: "BK043", name: "Software Engineering: A Practitioner's Approach", author: "Roger S. Pressman & Bruce Maxim", category: "Software Engineering", quantity: 10, availableQuantity: 10 },
  { bookId: "BK044", name: "The Mythical Man-Month", author: "Frederick P. Brooks Jr.", category: "Software Engineering", quantity: 6, availableQuantity: 6 },
  { bookId: "BK045", name: "Design Patterns: Elements of Reusable Object-Oriented Software", author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides", category: "Software Engineering", quantity: 7, availableQuantity: 7 },
  { bookId: "BK046", name: "Agile Software Development: Principles, Patterns, and Practices", author: "Robert C. Martin", category: "Software Engineering", quantity: 5, availableQuantity: 5 },

  /* ─── Artificial Intelligence ──────────────── */
  { bookId: "BK047", name: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell & Peter Norvig", category: "Artificial Intelligence", quantity: 12, availableQuantity: 12 },
  { bookId: "BK048", name: "Artificial Intelligence", author: "Elaine Rich & Kevin Knight", category: "Artificial Intelligence", quantity: 9, availableQuantity: 9 },
  { bookId: "BK049", name: "Introduction to Artificial Intelligence", author: "Wolfgang Ertel", category: "Artificial Intelligence", quantity: 7, availableQuantity: 7 },
  { bookId: "BK050", name: "AI: A Guide to Intelligent Systems", author: "Michael Negnevitsky", category: "Artificial Intelligence", quantity: 6, availableQuantity: 6 },
  { bookId: "BK051", name: "Artificial Intelligence: Structures and Strategies for Complex Problem Solving", author: "George F. Luger", category: "Artificial Intelligence", quantity: 5, availableQuantity: 5 },
  { bookId: "BK052", name: "Prolog Programming for Artificial Intelligence", author: "Ivan Bratko", category: "Artificial Intelligence", quantity: 4, availableQuantity: 4 },

  /* ─── Machine Learning ─────────────────────── */
  { bookId: "BK053", name: "Hands-On Machine Learning with Scikit-Learn, Keras and TensorFlow", author: "Aurélien Géron", category: "Machine Learning", quantity: 10, availableQuantity: 10 },
  { bookId: "BK054", name: "Pattern Recognition and Machine Learning", author: "Christopher M. Bishop", category: "Machine Learning", quantity: 7, availableQuantity: 7 },
  { bookId: "BK055", name: "Machine Learning", author: "Tom M. Mitchell", category: "Machine Learning", quantity: 8, availableQuantity: 8 },
  { bookId: "BK056", name: "Deep Learning", author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville", category: "Machine Learning", quantity: 9, availableQuantity: 9 },
  { bookId: "BK057", name: "The Hundred-Page Machine Learning Book", author: "Andriy Burkov", category: "Machine Learning", quantity: 6, availableQuantity: 6 },
  { bookId: "BK058", name: "Machine Learning with Python Cookbook", author: "Chris Albon", category: "Machine Learning", quantity: 7, availableQuantity: 7 },

  /* ─── Cyber Security ───────────────────────── */
  { bookId: "BK059", name: "Hacking: The Art of Exploitation", author: "Jon Erickson", category: "Cyber Security", quantity: 7, availableQuantity: 7 },
  { bookId: "BK060", name: "The Web Application Hacker's Handbook", author: "Dafydd Stuttard & Marcus Pinto", category: "Cyber Security", quantity: 6, availableQuantity: 6 },
  { bookId: "BK061", name: "Cybersecurity Essentials", author: "Charles J. Brooks, Christopher Grow, Philip Craig, Donald Short", category: "Cyber Security", quantity: 8, availableQuantity: 8 },
  { bookId: "BK062", name: "Ethical Hacking and Penetration Testing Guide", author: "Rafay Baloch", category: "Cyber Security", quantity: 5, availableQuantity: 5 },
  { bookId: "BK063", name: "Security Engineering: A Guide to Building Dependable Distributed Systems", author: "Ross J. Anderson", category: "Cyber Security", quantity: 5, availableQuantity: 5 },

  /* ─── Cloud Computing ──────────────────────── */
  { bookId: "BK064", name: "Cloud Computing: Concepts, Technology and Architecture", author: "Thomas Erl, Ricardo Puttini, Zaigham Mahmood", category: "Cloud Computing", quantity: 8, availableQuantity: 8 },
  { bookId: "BK065", name: "Architecting the Cloud", author: "Michael J. Kavis", category: "Cloud Computing", quantity: 6, availableQuantity: 6 },
  { bookId: "BK066", name: "AWS in Action", author: "Andreas Wittig & Michael Wittig", category: "Cloud Computing", quantity: 7, availableQuantity: 7 },
  { bookId: "BK067", name: "Cloud Native Patterns", author: "Cornelia Davis", category: "Cloud Computing", quantity: 5, availableQuantity: 5 },
  { bookId: "BK068", name: "Google Cloud Platform in Action", author: "JJ Geewax", category: "Cloud Computing", quantity: 4, availableQuantity: 4 },

  /* ─── Web Development ──────────────────────── */
  { bookId: "BK069", name: "HTML and CSS: Design and Build Websites", author: "Jon Duckett", category: "Web Development", quantity: 12, availableQuantity: 12 },
  { bookId: "BK070", name: "JavaScript and JQuery: Interactive Front-End Web Development", author: "Jon Duckett", category: "Web Development", quantity: 10, availableQuantity: 10 },
  { bookId: "BK071", name: "Learning PHP, MySQL and JavaScript", author: "Robin Nixon", category: "Web Development", quantity: 8, availableQuantity: 8 },
  { bookId: "BK072", name: "Node.js Design Patterns", author: "Mario Casciaro & Luciano Mammino", category: "Web Development", quantity: 6, availableQuantity: 6 },
  { bookId: "BK073", name: "Eloquent JavaScript", author: "Marijn Haverbeke", category: "Web Development", quantity: 7, availableQuantity: 7 },
  { bookId: "BK074", name: "Full Stack Web Development with Vue.js and Node", author: "Aneeta Sharma", category: "Web Development", quantity: 5, availableQuantity: 5 },

  /* ─── Mobile Development ───────────────────── */
  { bookId: "BK075", name: "Android Programming: The Big Nerd Ranch Guide", author: "Bill Phillips & Chris Stewart", category: "Mobile Development", quantity: 8, availableQuantity: 8 },
  { bookId: "BK076", name: "iOS Programming: The Big Nerd Ranch Guide", author: "Christian Keur & Aaron Hillegass", category: "Mobile Development", quantity: 6, availableQuantity: 6 },
  { bookId: "BK077", name: "Flutter in Action", author: "Eric Windmill", category: "Mobile Development", quantity: 7, availableQuantity: 7 },
  { bookId: "BK078", name: "React Native in Action", author: "Nader Dabit", category: "Mobile Development", quantity: 5, availableQuantity: 5 },

  /* ─── Electronics ──────────────────────────── */
  { bookId: "BK079", name: "Electronic Devices and Circuit Theory", author: "Robert L. Boylestad & Louis Nashelsky", category: "Electronics", quantity: 13, availableQuantity: 13 },
  { bookId: "BK080", name: "Fundamentals of Electric Circuits", author: "Charles K. Alexander & Matthew N.O. Sadiku", category: "Electronics", quantity: 10, availableQuantity: 10 },
  { bookId: "BK081", name: "Digital Design", author: "M. Morris Mano & Michael D. Ciletti", category: "Electronics", quantity: 12, availableQuantity: 12 },
  { bookId: "BK082", name: "Microprocessors and Microcontrollers", author: "Krishna Kant", category: "Electronics", quantity: 9, availableQuantity: 9 },
  { bookId: "BK083", name: "Signals and Systems", author: "Alan V. Oppenheim & Alan S. Willsky", category: "Electronics", quantity: 8, availableQuantity: 8 },

  /* ─── Mathematics ──────────────────────────── */
  { bookId: "BK084", name: "Discrete Mathematics and Its Applications", author: "Kenneth H. Rosen", category: "Mathematics", quantity: 14, availableQuantity: 14 },
  { bookId: "BK085", name: "Engineering Mathematics", author: "B.S. Grewal", category: "Mathematics", quantity: 15, availableQuantity: 15 },
  { bookId: "BK086", name: "Higher Engineering Mathematics", author: "H.K. Dass", category: "Mathematics", quantity: 13, availableQuantity: 13 },
  { bookId: "BK087", name: "Linear Algebra and Its Applications", author: "Gilbert Strang", category: "Mathematics", quantity: 9, availableQuantity: 9 },
  { bookId: "BK088", name: "Probability and Statistics for Engineers and Scientists", author: "Ronald E. Walpole & Raymond H. Myers", category: "Mathematics", quantity: 10, availableQuantity: 10 },
  { bookId: "BK089", name: "Calculus: Early Transcendentals", author: "James Stewart", category: "Mathematics", quantity: 11, availableQuantity: 11 },

  /* ─── Aptitude ─────────────────────────────── */
  { bookId: "BK090", name: "Quantitative Aptitude for Competitive Examinations", author: "R.S. Aggarwal", category: "Aptitude", quantity: 15, availableQuantity: 15 },
  { bookId: "BK091", name: "A Modern Approach to Verbal and Non-Verbal Reasoning", author: "R.S. Aggarwal", category: "Aptitude", quantity: 12, availableQuantity: 12 },
  { bookId: "BK092", name: "How to Prepare for Quantitative Aptitude for the CAT", author: "Arun Sharma", category: "Aptitude", quantity: 10, availableQuantity: 10 },
  { bookId: "BK093", name: "Magical Book on Quicker Maths", author: "M. Tyra", category: "Aptitude", quantity: 9, availableQuantity: 9 },

  /* ─── English Communication ────────────────── */
  { bookId: "BK094", name: "English Grammar in Use", author: "Raymond Murphy", category: "English Communication", quantity: 14, availableQuantity: 14 },
  { bookId: "BK095", name: "Word Power Made Easy", author: "Norman Lewis", category: "English Communication", quantity: 13, availableQuantity: 13 },
  { bookId: "BK096", name: "High School English Grammar and Composition", author: "P.C. Wren & H. Martin", category: "English Communication", quantity: 12, availableQuantity: 12 },
  { bookId: "BK097", name: "Objective English for Competitive Examinations", author: "Hari Mohan Prasad & Uma Rani Sinha", category: "English Communication", quantity: 10, availableQuantity: 10 },
  { bookId: "BK098", name: "Business Communication", author: "Urmila Rai & S.M. Rai", category: "English Communication", quantity: 8, availableQuantity: 8 },
  { bookId: "BK099", name: "Technical Communication: Principles and Practice", author: "Meenakshi Raman & Sangeetha Sharma", category: "English Communication", quantity: 9, availableQuantity: 9 },
  { bookId: "BK100", name: "Communicative English for Engineers and Professionals", author: "S.P. Dhanavel", category: "English Communication", quantity: 10, availableQuantity: 10 },
];

/* ── Seed Function ──────────────────────────────── */
const seedBooks = async () => {
  await connectDB();

  try {
    const existingCount = await Book.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Books collection already has ${existingCount} document(s).`);
      console.log('   Skipping seed to avoid duplicates.');
      console.log('   To re-seed, manually drop the books collection first.');
      process.exit(0);
    }

    // Insert all books (bypass the pre-save hook for bookId since we provide them manually)
    const inserted = await Book.insertMany(books, { ordered: true });
    console.log(`✅ Successfully seeded ${inserted.length} books!`);

    // Category summary
    const categories = {};
    books.forEach(b => {
      categories[b.category] = (categories[b.category] || 0) + 1;
    });
    console.log('\n📚 Books by Category:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat.padEnd(25)} → ${count} book(s)`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Book seed failed:', err.message);
    process.exit(1);
  }
};

seedBooks();
