/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> Vadim Demedes;' +
        ' Licensed MIT. */'
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', 'lib/templato.js'],
        dest: 'dist/<%= pkg.name %>.js'
      },
	  ejs: {
		src: ['<banner:meta.banner>', 'vendor/ejs/ejs.js', 'lib/engines/ejs.js'],
		dest: 'dist/engines/ejs.js'
	  },
	  mustache: {
		src: ['<banner:meta.banner>', 'vendor/hogan/hogan.js', 'lib/engines/mustache.js'],
		dest: 'dist/engines/mustache.js'
	  },
	  jade: {
		src: ['<banner:meta.banner>', 'vendor/jade/jade.js', 'lib/engines/jade.js'],
		dest: 'dist/engines/jade.js'
	  }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      },
	  ejs: {
		src: ['<banner:meta.banner>', '<config:concat.ejs.dest>'],
		dest: 'dist/engines/ejs.min.js'
	  },
	  mustache: {
		src: ['<banner:meta.banner>', '<config:concat.mustache.dest>'],
		dest: 'dist/engines/mustache.min.js'
	  },
	  jade: {
		src: ['<banner:meta.banner>', '<config:concat.jade.dest>'],
		dest: 'dist/engines/jade.min.js'
	  }
    },
    watch: {
      files: ['vendor/ejs/ejs.js', 'lib/engines/ejs.js',
			'vendor/hogan/hogan.js', 'lib/engines/mustache.js',
			'lib/engines/eco.js',
			'vendor/jade/jade.js', 'lib/engines/jade.js',
			'lib/templato.js'],
      tasks: 'concat min'
    },
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'concat min');

};
