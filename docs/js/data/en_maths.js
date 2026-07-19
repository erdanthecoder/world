/* Year 9 Maths — English. Original educational text written for this platform. */
window.LIBRARY = (window.LIBRARY || []).concat([
{
  id: "mth-algebra", lang: "en", category: "maths", year: 9,
  title: "The Language of Algebra", author: "ReadWorld Maths",
  cover: { c1: "#7b41d6", c2: "#33125e" },
  description: "Algebra is the language mathematicians use to describe patterns and solve puzzles that ordinary numbers cannot. This Year 9 reader introduces letters as numbers, teaches you to balance and solve equations, and shows how algebra quietly runs the modern world.",
  chapters: [
    {
      title: "1 · Why Letters in Maths?",
      paragraphs: [
        "The first time most people see a letter in a maths problem, they feel a small shock. Numbers made sense — but why is there suddenly an 'x' where a number should be? The answer is beautifully simple. In algebra, a letter is just a stand-in for a number we do not yet know, or for a number that could change. Far from making things harder, letters let us say powerful things that ordinary numbers cannot.",
        "Imagine a bag holding an unknown number of marbles. You do not know how many are inside, but you can still reason about them. If you call that unknown number 'n', then a bag with three extra marbles added holds 'n + 3'. Two identical bags hold '2n'. You have described a real situation exactly, even though you do not know the actual count. That is the whole idea of algebra: reasoning about numbers before you know what they are.",
        "Algebra also lets us capture patterns. Suppose a taxi charges a fixed fee of three pounds, plus two pounds for every mile. For a journey of any length, the cost is 'two times the number of miles, plus three'. We can write this as a neat formula: cost = 2m + 3, where 'm' is the number of miles. One short line now describes every possible journey — one mile or a thousand.",
        "In algebra we follow a few tidy customs. We usually leave out the multiplication sign, so '2n' means 'two times n'. A letter on its own, like 'x', secretly means 'one x'. And letters near the start of the alphabet often stand for fixed, known numbers, while letters near the end — x, y, z — usually stand for the unknowns we are hunting for. These small habits keep algebra clear and quick to read.",
        "Once you accept that a letter is simply a number in disguise, algebra stops being frightening and starts being useful. It is the tool that lets engineers predict, scientists model, and shopkeepers calculate. Every formula you will ever meet, from the area of a circle to the speed of a rocket, is written in this same language of letters and numbers.",
      ],
      quiz: [
        { q: "In algebra, what does a letter such as 'x' usually represent?", options: ["A mistake", "A number we don't know yet or that can change", "The number ten", "A type of shape"], a: 1, explain: "A letter stands in for an unknown number, or a number that can vary." },
        { q: "What does '2n' mean?", options: ["Two, then n", "Twenty-something", "Two times n", "n squared"], a: 2, explain: "By convention we drop the multiplication sign, so 2n means 'two multiplied by n'." },
        { q: "A taxi costs £3 plus £2 per mile. Which formula gives the cost for m miles?", options: ["3m + 2", "2m + 3", "6m", "m + 5"], a: 1, explain: "Two pounds per mile is 2m, plus the fixed £3, giving cost = 2m + 3." },
        { q: "By convention, a lone letter like 'x' secretly means:", options: ["Zero x", "One x", "Ten x", "No value"], a: 1, explain: "A letter written on its own means one of that letter — 'x' means '1x'." },
      ],
    },
    {
      title: "2 · The Balance of an Equation",
      paragraphs: [
        "An equation is a mathematical sentence that says two things are equal. The equals sign is like the pivot of a perfectly balanced pair of scales: whatever sits on the left weighs exactly the same as whatever sits on the right. This picture of a balance is the single most useful idea for solving equations, and it is worth keeping in your mind at all times.",
        "Suppose we are told that x + 4 = 10. This says: some unknown number, with four added, gives ten. Your instinct probably already whispers the answer, but let us solve it the algebraic way, using the balance. The golden rule is this: whatever you do to one side of an equation, you must do exactly the same to the other side, or the scales tip and the equality breaks.",
        "To find x alone, we want to remove the '+4' from the left. So we subtract four from the left — but to keep the balance, we must also subtract four from the right. On the left, x + 4 − 4 leaves just x. On the right, 10 − 4 leaves 6. So x = 6. We can always check by putting the answer back into the original: 6 + 4 does indeed equal 10. The balance held.",
        "The same method unlocks tougher equations. Consider 3x = 12: three times some number is twelve. Here the x is multiplied by three, so to undo it we divide both sides by three. Twelve divided by three is four, so x = 4. The rule is to do the opposite operation: addition is undone by subtraction, and multiplication is undone by division. We are peeling away the operations around x, one careful layer at a time.",
        "Even a two-step equation yields to this patience. Take 2x + 1 = 9. First we subtract one from both sides to get 2x = 8. Then we divide both sides by two to get x = 4. Notice the order: we undid the addition first, then the multiplication — the reverse of how they were built up. Solving equations is a little like unwrapping a parcel: you undo the last thing that was done first, working steadily inward until the unknown stands alone.",
      ],
      quiz: [
        { q: "What is the golden rule for keeping an equation balanced?", options: ["Only change the left side", "Whatever you do to one side, do the same to the other", "Always add the same number", "Never use division"], a: 1, explain: "To keep the scales balanced, any operation must be done equally to both sides." },
        { q: "Solve: x + 4 = 10.", options: ["x = 14", "x = 4", "x = 6", "x = 40"], a: 2, explain: "Subtract 4 from both sides: x = 10 − 4 = 6." },
        { q: "Solve: 3x = 12.", options: ["x = 4", "x = 9", "x = 36", "x = 15"], a: 0, explain: "Divide both sides by 3: x = 12 ÷ 3 = 4." },
        { q: "To solve 2x + 1 = 9, what should you do first?", options: ["Divide both sides by 2", "Subtract 1 from both sides", "Add 1 to both sides", "Multiply both sides by 2"], a: 1, explain: "Undo the last step first: subtract 1 to get 2x = 8, then divide by 2 to get x = 4." },
      ],
    },
    {
      title: "3 · Patterns, Sequences and Formulas",
      paragraphs: [
        "Look at this line of numbers: 3, 7, 11, 15, 19... Can you feel the pattern? Each number is four more than the one before. A list of numbers that follows a rule like this is called a sequence, and each number in it is called a term. Algebra gives us the power not just to describe such a sequence, but to leap straight to any term we like — even the hundredth — without writing out all the ones before it.",
        "In our sequence, the step from one term to the next is always four. This constant step is called the common difference. Because we keep adding four, the four-times table is hiding inside the sequence. The first term is 3; to reach the second we add one lot of four; to reach the third we add two lots of four, and so on. This regular structure is exactly the kind of pattern algebra was built to capture.",
        "Mathematicians write a rule for the nth term — a formula that turns the position number into the value at that position. For our sequence the rule is 4n − 1. Let us test it. For the first term, n = 1, so 4 × 1 − 1 = 3. Correct. For the second, n = 2, so 4 × 2 − 1 = 7. Correct again. To find the fiftieth term, we simply put n = 50: 4 × 50 − 1 = 199, without listing a single one of the terms in between.",
        "Finding such a rule is like being a detective. The common difference tells you what number multiplies n — here, four. Then you adjust with a fixed number to make the first term come out right: four times one is four, but we wanted three, so we subtract one, giving 4n − 1. With a little practice you can find the rule for almost any sequence that rises or falls in even steps, and read its secrets at a glance.",
        "Formulas like these are everywhere once you look. The seats in each row of a theatre, the savings that grow by a fixed amount each month, the number of tiles needed to edge a pond — all follow sequences, and all can be captured by a formula. This is the quiet power of algebra: it takes a pattern you can only see a little way into, and hands you a rule that reaches all the way to infinity.",
      ],
      quiz: [
        { q: "In the sequence 3, 7, 11, 15…, what is the common difference?", options: ["3", "4", "7", "11"], a: 1, explain: "Each term is 4 more than the previous one, so the common difference is 4." },
        { q: "The rule for the sequence is 4n − 1. What is the 10th term?", options: ["40", "39", "41", "36"], a: 1, explain: "Put n = 10: 4 × 10 − 1 = 40 − 1 = 39." },
        { q: "What is a 'term' in a sequence?", options: ["The rule of the sequence", "Each individual number in the sequence", "The difference between numbers", "The first number only"], a: 1, explain: "A term is one of the individual numbers that make up the sequence." },
        { q: "For a sequence going up in steps of 5, what will multiply n in its nth-term rule?", options: ["1", "5", "10", "It depends on the first term"], a: 1, explain: "The common difference (5) is always the number that multiplies n in the nth-term rule." },
      ],
    },
  ],
},
{
  id: "mth-geometry", lang: "en", category: "maths", year: 9,
  title: "Shapes, Space and Pythagoras", author: "ReadWorld Maths",
  cover: { c1: "#127a8f", c2: "#0a3b45" },
  description: "Geometry is the mathematics of shape and space, from the angles in a triangle to a rule discovered 2,500 years ago that still helps build skyscrapers. This Year 9 reader explores angles, triangles and the famous theorem of Pythagoras.",
  chapters: [
    {
      title: "1 · Angles All Around Us",
      paragraphs: [
        "An angle measures an amount of turn. When you open a door, the door sweeps through an angle. When the hands of a clock move, they turn through angles. We measure angles in degrees, and a full turn all the way around is 360 degrees. A quarter turn — the corner of this page, or of any square — is 90 degrees, and we call it a right angle. Angles are the grammar of geometry.",
        "Angles come with useful names that describe their size. An angle smaller than 90 degrees is called acute — think of it as small and sharp. An angle of exactly 90 degrees is a right angle, often marked with a little square. An angle between 90 and 180 degrees is obtuse — wide and open. And an angle of exactly 180 degrees is a straight line, a half turn. Learning to recognise these at a glance makes every geometry problem easier.",
        "Some angle facts are so reliable that we can build on them without measuring. Angles on a straight line always add up to 180 degrees. So if one angle on a straight line is 120 degrees, the angle beside it must be 60, because together they make 180. Similarly, angles around a single point add up to 360 degrees, the whole turn. These simple rules let us find unknown angles by reasoning alone.",
        "When two straight lines cross, they make four angles, and these come in a pleasing pattern. The angles opposite each other across the crossing point are always equal — we call them vertically opposite angles. If one angle at the crossing is 70 degrees, the angle directly opposite it is also 70 degrees, and the two remaining angles are each 110 degrees. Nature and geometry both love this kind of symmetry.",
        "These facts may seem small, but together they are surprisingly powerful. Given a diagram with only one or two angles marked, a careful thinker can often work out every remaining angle without a protractor, simply by applying the rules: straight lines make 180, points make 360, opposite angles match. Geometry rewards the patient reasoner who trusts the rules and follows them step by step.",
      ],
      quiz: [
        { q: "How many degrees are there in a full turn?", options: ["90", "180", "270", "360"], a: 3, explain: "A complete turn all the way around is 360 degrees." },
        { q: "What do we call an angle smaller than 90 degrees?", options: ["Obtuse", "Right", "Acute", "Straight"], a: 2, explain: "An angle less than 90° is acute; exactly 90° is a right angle; between 90° and 180° is obtuse." },
        { q: "Two angles sit on a straight line. One is 120°. What is the other?", options: ["60°", "120°", "40°", "240°"], a: 0, explain: "Angles on a straight line add up to 180°, so the other is 180 − 120 = 60°." },
        { q: "Two lines cross. One angle is 70°. What is the vertically opposite angle?", options: ["110°", "20°", "70°", "90°"], a: 2, explain: "Vertically opposite angles are always equal, so it is also 70°." },
      ],
    },
    {
      title: "2 · The Triangle, the Strongest Shape",
      paragraphs: [
        "Of all the shapes in geometry, the triangle is the simplest closed figure you can make with straight lines — just three sides and three corners. Yet it may also be the most important. Engineers prize the triangle above all other shapes because it is rigid: push on a triangle and it holds its form, while a square can be shoved sideways into a lopsided diamond. That is why bridges, cranes and roofs are full of triangles.",
        "The most famous fact about triangles is a gift to problem-solvers everywhere: the three angles inside any triangle always add up to exactly 180 degrees. It does not matter whether the triangle is tall and thin or short and wide — the total is always the same. So if you know two of the angles, you can always find the third by subtracting from 180. If two angles are 60 and 70, the third must be 50.",
        "Triangles come in families named after their sides and angles. An equilateral triangle has all three sides equal and, as a result, all three angles equal to 60 degrees. An isosceles triangle has two equal sides and two equal base angles. A scalene triangle has all three sides different. And a right-angled triangle contains one 90-degree angle — a family so special that the whole of the next chapter is devoted to it.",
        "Knowing these families helps enormously, because equal sides come with equal angles attached. In an isosceles triangle, if you know one of the two equal base angles, you instantly know the other, and can then find the third by subtracting from 180. Geometry is full of these chains of reasoning, where one fact unlocks the next, until the whole diagram gives up its secrets.",
        "Triangles are not just abstract shapes on a page. They appear in the trusses of a railway bridge, the framework of a bicycle, the struts of an electricity pylon and the rafters of your own roof. Wherever strength and stability are needed from the least amount of material, engineers reach for the humble, unbreakable triangle. Understanding it is understanding a shape that quite literally holds up the modern world.",
      ],
      quiz: [
        { q: "What do the three angles inside any triangle add up to?", options: ["90°", "180°", "270°", "360°"], a: 1, explain: "The interior angles of every triangle always sum to 180°." },
        { q: "Why do engineers use triangles in bridges and towers?", options: ["They are cheap to paint", "They are rigid and hold their shape", "They are round", "They use more material"], a: 1, explain: "A triangle is rigid — it keeps its shape under pressure, unlike a square which can be pushed askew." },
        { q: "A triangle has angles of 60° and 70°. What is the third angle?", options: ["40°", "50°", "60°", "70°"], a: 1, explain: "180 − 60 − 70 = 50°." },
        { q: "What is true of an equilateral triangle?", options: ["It has one right angle", "All three sides and angles are equal", "Two sides are equal", "All sides are different"], a: 1, explain: "An equilateral triangle has three equal sides and three equal 60° angles." },
      ],
    },
    {
      title: "3 · Pythagoras and the Right-Angled Triangle",
      paragraphs: [
        "Around 2,500 years ago, in ancient Greece, a thinker named Pythagoras and his followers discovered a rule about right-angled triangles so useful that it is still taught to every student today and used daily by builders, sailors and computer programmers. It concerns only triangles that contain one right angle, but for those triangles it is exact and never fails.",
        "In a right-angled triangle, the longest side — the one directly opposite the right angle — has a special name: the hypotenuse. It is always the longest of the three sides. The other two shorter sides are the ones that meet to form the right angle itself. Getting to know which side is the hypotenuse is the first step to using the rule correctly.",
        "Here is the rule, known as Pythagoras' theorem. If you draw a square on each of the three sides of a right-angled triangle, the area of the square on the hypotenuse exactly equals the areas of the other two squares added together. In symbols, if the two shorter sides are a and b, and the hypotenuse is c, then a² + b² = c². The two smaller squares, cut up, would fit perfectly into the largest one.",
        "This lets us find a missing side. Suppose the two short sides of a right-angled triangle are 3 and 4 units long. Then a² + b² is 3² + 4², which is 9 + 16, which is 25. So c², the square of the hypotenuse, is 25, and the hypotenuse itself is the square root of 25, which is 5. The famous '3, 4, 5' triangle has been used by builders for thousands of years to make perfect right angles on the ground.",
        "The power of Pythagoras' theorem is that it turns a question about distance into a question about numbers. Sailors use it to work out how far they have travelled; carpenters use it to check that corners are truly square; and inside every computer game, the theorem quietly calculates the distance between characters on the screen. A discovery made in the ancient world, with nothing but string and reason, still helps shape the world you live in today.",
      ],
      quiz: [
        { q: "What is the hypotenuse of a right-angled triangle?", options: ["The shortest side", "The longest side, opposite the right angle", "The side at the bottom", "Any of the three sides"], a: 1, explain: "The hypotenuse is the longest side and always lies opposite the right angle." },
        { q: "What is Pythagoras' theorem?", options: ["a + b = c", "a² + b² = c²", "a × b = c", "a² − b² = c²"], a: 1, explain: "For a right-angled triangle with hypotenuse c: a² + b² = c²." },
        { q: "The two shorter sides are 3 and 4. What is the hypotenuse?", options: ["5", "7", "12", "25"], a: 0, explain: "3² + 4² = 9 + 16 = 25, and the square root of 25 is 5." },
        { q: "Pythagoras' theorem works only for which triangles?", options: ["All triangles", "Equilateral triangles", "Right-angled triangles", "Triangles with equal sides"], a: 2, explain: "The theorem applies only to right-angled triangles — those containing a 90° angle." },
      ],
    },
  ],
},
]);
