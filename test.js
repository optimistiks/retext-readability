'use strict';

var test = require('tape');
var retext = require('retext');
var readability = require('./');

test('readability', function (t) {
  retext()
    .use(readability)
    .process('The cat sat on the mat', function (err, file) {
      t.ifError(err, 'should not fail (#1)');

      t.deepEqual(
        file.data.result,
        {
          ages: {
            daleChallAge: 13,
            ariAge: 0,
            colemanLiauAge: 1,
            fleschAge: 9,
            smogAge: 5,
            gunningFogAge: 7,
            spacheAge: 9
          },
          grades: {daleChallGrade: 8, ariGrade: -5.09, colemanLiauGrade: -4.07, fleschGrade: 116.15, smogGrade: 3.13, gunningFogGrade: 2.4, spacheGrade: 4.12},
          sentenceCount: 1,
          wordCount: 6,
          characterCount: 17
        },
        'should give correct results for the whole text'
      );

      t.deepEqual(
          file.messages.map(String),
          [],
          'should not warn when a sentence is easy to read'
      );
    });

  retext()
    .use(readability)
    .process([
      'Oberon, also designated Uranus IV, is the outermost ',
      'major moon of the planet Uranus and quite large',
      'and massive for a Uranian moon.',
      ''
    ].join('\n'), function (err, file) {
      t.ifError(err, 'should not fail (#2)');

      t.deepEqual(
        file.data.result,
        {ages: {daleChallAge: Infinity, ariAge: 17, colemanLiauAge: 15, fleschAge: 18, smogAge: 7, gunningFogAge: 18, spacheAge: 13}, grades: {daleChallGrade: Infinity, ariGrade: 11.78, colemanLiauGrade: 10.01, fleschGrade: 29, smogGrade: 17.12, gunningFogGrade: 12.68, spacheGrade: 8.43}, sentenceCount: 1, wordCount: 23, characterCount: 106},
        'should give correct results for the whole text'
      );

      t.deepEqual(
        file.messages.map(String),
        ['1:1-3:32: Hard to read sentence (confidence: 4/7)'],
        'should warn when low confidence that a sentence is hard to read'
      );
    });

  retext()
    .use(readability, {threshold: 5 / 7})
    .process([
      'Oberon, also designated Uranus IV, is the outermost ',
      'major moon of the planet Uranus and quite large',
      'and massive for a Uranian moon.',
      ''
    ].join('\n'), function (err, file) {
      t.ifError(err, 'should not fail (#3)');

      t.deepEqual(
        file.data.result,
        {ages: {daleChallAge: Infinity, ariAge: 17, colemanLiauAge: 15, fleschAge: 18, smogAge: 7, gunningFogAge: 18, spacheAge: 13}, grades: {daleChallGrade: Infinity, ariGrade: 11.78, colemanLiauGrade: 10.01, fleschGrade: 29, smogGrade: 17.12, gunningFogGrade: 12.68, spacheGrade: 8.43}, sentenceCount: 1, wordCount: 23, characterCount: 106},
        'should give correct results for the whole text'
      );

      t.deepEqual(
        file.messages.map(String),
        [],
        'should support a threshold'
      );
    });

  retext()
    .use(readability, {age: 18})
    .process([
      'Oberon, also designated Uranus IV, is the outermost ',
      'major moon of the planet Uranus and quite large',
      'and massive for a Uranian moon.',
      ''
    ].join('\n'), function (err, file) {
      t.ifError(err, 'should not fail (#4)');

      t.deepEqual(
        file.data.result,
        {ages: {daleChallAge: Infinity, ariAge: 17, colemanLiauAge: 15, fleschAge: 18, smogAge: 7, gunningFogAge: 18, spacheAge: 13}, grades: {daleChallGrade: Infinity, ariGrade: 11.78, colemanLiauGrade: 10.01, fleschGrade: 29, smogGrade: 17.12, gunningFogGrade: 12.68, spacheGrade: 8.43}, sentenceCount: 1, wordCount: 23, characterCount: 106},
        'should give correct results for the whole text'
      );

      t.deepEqual(
        file.messages.map(String),
        [],
        'should support a given age (removing the warning)'
      );
    });

  retext()
    .use(readability, {age: 14})
    .process([
      'Oberon, also designated Uranus IV, is the outermost ',
      'major moon of the planet Uranus and quite large',
      'and massive for a Uranian moon.',
      ''
    ].join('\n'), function (err, file) {
      t.ifError(err, 'should not fail (#5)');

      t.deepEqual(
        file.data.result,
        {ages: {daleChallAge: Infinity, ariAge: 17, colemanLiauAge: 15, fleschAge: 18, smogAge: 7, gunningFogAge: 18, spacheAge: 13}, grades: {daleChallGrade: Infinity, ariGrade: 11.78, colemanLiauGrade: 10.01, fleschGrade: 29, smogGrade: 17.12, gunningFogGrade: 12.68, spacheGrade: 8.43}, sentenceCount: 1, wordCount: 23, characterCount: 106},
        'should give correct results for the whole text'
      );

      t.deepEqual(
        file.messages.map(String),
        ['1:1-3:32: Hard to read sentence (confidence: 5/7)'],
        'should support a given age (upping the warning)'
      );
    });

  retext()
    .use(readability)
    .process([
      'Oberon, also designated Uranus IV, is the outermost ',
      'major moon of the planet Uranus and the second-largest ',
      'and second most massive of the Uranian moons.',
      ''
    ].join('\n'), function (err, file) {
      t.ifError(err, 'should not fail (#6)');

      t.deepEqual(
        file.data.result,
        {ages: {daleChallAge: Infinity, ariAge: 20, colemanLiauAge: 17, fleschAge: 18, smogAge: 7, gunningFogAge: 20, spacheAge: 15}, grades: {daleChallGrade: Infinity, ariGrade: 14.62, colemanLiauGrade: 12.42, fleschGrade: 22.41, smogGrade: 18.24, gunningFogGrade: 14.8, spacheGrade: 9.59}, sentenceCount: 1, wordCount: 25, characterCount: 125},
        'should give correct results for the whole text'
      );

      t.deepEqual(
        file.messages.map(String),
        ['1:1-3:46: Hard to read sentence (confidence: 5/7)'],
        'should warn when moderately confident that a sentence is hard to read'
      );
    });

  retext()
    .use(readability, {age: 14})
    .process([
      'Oberon, also designated Uranus IV, is the outermost ',
      'major moon of the planet Uranus and the second-largest ',
      'and second most massive of the Uranian moons, and the ',
      'ninth most massive moon in the Solar System.',
      ''
    ].join('\n'), function (err, file) {
      t.ifError(err, 'should not fail (#7)');

      t.deepEqual(
        file.data.result,
        {ages: {daleChallAge: Infinity, ariAge: 24, colemanLiauAge: 16, fleschAge: 18, smogAge: 7, gunningFogAge: 22, spacheAge: 16}, grades: {daleChallGrade: Infinity, ariGrade: 18.54, colemanLiauGrade: 11.41, fleschGrade: 26.28, smogGrade: 18.24, gunningFogGrade: 17.43, spacheGrade: 11.22}, sentenceCount: 1, wordCount: 35, characterCount: 167},
        'should give correct results for the whole text'
      );

      t.deepEqual(
        file.messages.map(String),
        ['1:1-4:45: Hard to read sentence (confidence: 6/7)'],
        'should warn when highly confident that a sentence is hard to read'
      );
    });

  retext()
    .use(readability)
    .process('Honorificabilitudinitatibus.', function (err, file) {
      t.ifError(err, 'should not fail (#8)');

      t.deepEqual(
        file.data.result,
        {ages: {daleChallAge: Infinity, ariAge: 111, colemanLiauAge: 118, fleschAge: 110, smogAge: 6, gunningFogAge: 5, spacheAge: 14}, grades: {daleChallGrade: Infinity, ariGrade: 106.24, colemanLiauGrade: 113.36, fleschGrade: -893.98, smogGrade: 8.84, gunningFogGrade: 0.4, spacheGrade: 8.98}, sentenceCount: 1, wordCount: 1, characterCount: 27},
        'should give correct results for the whole text'
      );

      t.deepEqual(
        file.messages.map(String),
        [],
        'should support minWords (default)'
      );
    });

  retext()
    .use(readability, {minWords: 0})
    .process('Honorificabilitudinitatibus.', function (err, file) {
      t.ifError(err, 'should not fail (#8)');

      t.deepEqual(
        file.data.result,
        {ages: {daleChallAge: Infinity, ariAge: 111, colemanLiauAge: 118, fleschAge: 110, smogAge: 6, gunningFogAge: 5, spacheAge: 14}, grades: {daleChallGrade: Infinity, ariGrade: 106.24, colemanLiauGrade: 113.36, fleschGrade: -893.98, smogGrade: 8.84, gunningFogGrade: 0.4, spacheGrade: 8.98}, sentenceCount: 1, wordCount: 1, characterCount: 27},
        'should give correct results for the whole text'
      );

      t.deepEqual(
        file.messages.map(String),
        ['1:1-1:29: Hard to read sentence (confidence: 4/7)'],
        'should support `minWords` (config)'
      );
    });

  t.end();
});
