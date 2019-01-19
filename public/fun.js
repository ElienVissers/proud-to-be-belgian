var flag = $('#flag');
var mainContent = $('.mainContent');
var funFacts = [
    "Belgium holds world record for longest period without a government. (589 days)",
    "Belgium produces more than 220.000 tons of chocolate per year.",
    "Audrey Hepburn was born in Brussels. (pan-European background)",
    "Brussels airport is the place where chocolate is being sold the most in the entire world.",
    "Robert Cailliau, co-inventor of the World Wide Web, is a Belgian.",
    "The Smurfs are all Belgian!",
    "In the 1970s, light beer was served during school lunches.",
    "Belgium has 3 official languages, but none of them is called 'Belgian'.",
    "The Belgian national symbol is a peeing boy: 'Mannenke Pis'. On holidays he wears special outfits.",
    "Belgium has bars where you can drink over 1500 different Belgian beers.",
    "You can make friends in Belgium just by talking about the weather.",
    "The ultimate Belgian dream is to retire at 50 and run a B&B in the South of Europe.",
    "Belgium has some of the best music festivals in the world, like Tomorrowland and Rock Werchter.",
    "Some of the world’s most famous painters are Belgian: Rubens, Ensor, Magritte, Delvaux, van Eyck…"
];

flag.click(function() {
    if (mainContent.children().eq(0).hasClass('funFact')) {
        mainContent.children().eq(0).remove();
    }
    mainContent.prepend('<div class="funFact">' + funFacts[Math.floor(funFacts.length * Math.random())] + '</div>');
});

flag.mouseout(function() {
    if (mainContent.children().eq(0).hasClass('funFact')) {
        mainContent.children().eq(0).remove();
    }
})
