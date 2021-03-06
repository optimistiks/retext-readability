'use strict';

var visit = require('unist-util-visit');
var toString = require('nlcst-to-string');
var syllable = require('syllable');
var daleChall = require('dale-chall');
var spache = require('spache');
var daleChallFormula = require('dale-chall-formula');
var ari = require('automated-readability');
var colemanLiau = require('coleman-liau');
var flesch = require('flesch');
var smog = require('smog-formula');
var gunningFog = require('gunning-fog');
var spacheFormula = require('spache-formula');

module.exports = readability;

var SOURCE = 'retext-readability';
var DEFAULT_TARGET_AGE = 16;
var WORDYNESS_THRESHOLD = 5;
var DEFAULT_THRESHOLD = 4 / 7;

var own = {}.hasOwnProperty;
var floor = Math.floor;
var round = Math.round;
var ceil = Math.ceil;
var sqrt = Math.sqrt;

function readability(options) {
  var settings = options || {};
  var targetAge = settings.age || DEFAULT_TARGET_AGE;
  var threshold = settings.threshold === null || settings.threshold === undefined ? DEFAULT_THRESHOLD : settings.threshold;
  var minWords = settings.minWords;

  if (minWords === null || minWords === undefined) {
    minWords = WORDYNESS_THRESHOLD;
  }

  return transformer;

  function transformer(tree, file) {
    var totalSentenceCount = 0;
    var totalWordCount = 0;
    var totalCharacterCount = 0;

    const totalGrades = {
      daleChall: 0,
      ari: 0,
      coleman: 0,
      flesch: 0,
      smog: 0,
      gunningFog: 0,
      spache: 0
    };

    visit(tree, 'SentenceNode', gather);

    function gather(sentence) {
      ++totalSentenceCount;

      var familiarWords = {};
      var easyWord = {};
      var complexPolysillabicWord = 0;
      var familiarWordCount = 0;
      var polysillabicWord = 0;
      var totalSyllables = 0;
      var easyWordCount = 0;
      var wordCount = 0;
      var letters = 0;
      var counts;
      var caseless;

      visit(sentence, 'WordNode', visitor);

      totalWordCount += wordCount;
      totalCharacterCount += letters;

      if (wordCount < minWords) {
        return;
      }

      counts = {
        complexPolysillabicWord: complexPolysillabicWord,
        polysillabicWord: polysillabicWord,
        unfamiliarWord: wordCount - familiarWordCount,
        difficultWord: wordCount - easyWordCount,
        syllable: totalSyllables,
        sentence: 1,
        word: wordCount,
        character: letters,
        letter: letters
      };

      const grades = {
        daleChall: getDaleChallGrade(counts),
        ari: ari(counts),
        coleman: colemanLiau(counts),
        flesch: fleschToGrade(flesch(counts)),
        smog: smog(counts),
        gunningFog: gunningFog(counts),
        spache: spacheFormula(counts)
      };

      Object.keys(grades).forEach(function (key) {
        totalGrades[key] += grades[key];
      });

      report(file, sentence, threshold, targetAge, [
        gradeToAge(grades.daleChall),
        gradeToAge(grades.ari),
        gradeToAge(grades.coleman),
        fleschToAge(flesch(counts)),
        smogToAge(grades.smog),
        gradeToAge(grades.gunningFog),
        gradeToAge(grades.spache)
      ], grades);

      function visitor(node) {
        var value = toString(node);
        var syllables = syllable(value);

        wordCount++;
        totalSyllables += syllables;
        letters += value.length;
        caseless = value.toLowerCase();

        /* Count complex words for gunning-fog based on
         * whether they have three or more syllables
         * and whether they aren’t proper nouns.  The
         * last is checked a little simple, so this
         * index might be over-eager. */
        if (syllables >= 3) {
          polysillabicWord++;

          if (value.charCodeAt(0) === caseless.charCodeAt(0)) {
            complexPolysillabicWord++;
          }
        }

        /* Find unique unfamiliar words for spache. */
        if (spache.indexOf(caseless) !== -1 && !own.call(familiarWords, caseless)) {
          familiarWords[caseless] = true;
          familiarWordCount++;
        }

        /* Find unique difficult words for dale-chall. */
        if (daleChall.indexOf(caseless) !== -1 && !own.call(easyWord, caseless)) {
          easyWord[caseless] = true;
          easyWordCount++;
        }
      }
    }

    var avgTotalGrades = Object.keys(totalGrades).reduce(function (obj, key) {
      obj[key] = totalGrades[key] / totalSentenceCount;
      return obj;
    }, {});

    var avgTotalGradesList = Object.keys(avgTotalGrades)
      .sort(
        function (keyA, keyB) {
          return totalGrades[keyA] - totalGrades[keyB];
        }
      )
      .map(
        function (key) {
          return avgTotalGrades[key];
        }
      )
      .slice(1, Object.keys(totalGrades).length - 1);

    var avgTotalGrade =
      Math.round(avgTotalGradesList
        .reduce(
          function (sum, grade) {
            return sum + grade;
          }
        ) / avgTotalGradesList.length);

    file.data.stats = {
      sentenceCount: totalSentenceCount,
      wordCount: totalWordCount,
      characterCount: totalCharacterCount,
      grade: avgTotalGrade
    };
  }
}

function getDaleChallGrade(counts) {
  var range = daleChallFormula.gradeLevel(daleChallFormula(counts));
  var grade = isFinite(range[1]) ? range[1] : range[0];
  return grade;
}

/* Calculate the typical starting age (on the higher-end) when
 * someone joins `grade` grade, in the US.
 * See https://en.wikipedia.org/wiki/Educational_stage#United_States. */
function gradeToAge(grade) {
  return round(grade + 5);
}

/* Calculate the age relating to a Flesch result. */
function fleschToAge(value) {
  return 20 - floor(value / 10);
}

/* Calculate the age relating to a SMOG result.
 * See http://www.readabilityformulas.com/smog-readability-formula.php. */
function smogToAge(value) {
  return ceil(sqrt(value) + 2.5);
}

/* Convert flesch reading ease to U.S. grade */
function fleschToGrade(fleschScore) {
  // Conversion is made according to
  // https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests#Flesch_Reading_Ease
  // lower bound is taken
  if (fleschScore < 30) {
    return 14;
  }
  if (fleschScore >= 30 && fleschScore < 50) {
    return 13;
  }
  if (fleschScore >= 50 && fleschScore < 60) {
    return 10;
  }
  if (fleschScore >= 60 && fleschScore < 70) {
    return 8;
  }
  if (fleschScore >= 70 && fleschScore < 80) {
    return 7;
  }
  if (fleschScore >= 80 && fleschScore < 90) {
    return 6;
  }
  return 5;
}

/* eslint-disable max-params */

/* Report the `results` if they’re reliably too hard for
 * the `target` age. */
function report(file, node, threshold, target, results, grades) {
  var length = results.length;
  var index = -1;
  var failCount = 0;
  var confidence;
  var message;

  while (++index < length) {
    if (results[index] > target) {
      failCount++;
    }
  }

  if (failCount / length >= threshold) {
    confidence = failCount + '/' + length;

    message = file.warn('Hard to read sentence (confidence: ' + confidence + ')', node, SOURCE);
    message.confidence = confidence;
    message.confidenceValue = failCount / length;
    message.source = SOURCE;
    message.actual = toString(node);
    message.expected = null;
    message.grades = grades;
  }
}
