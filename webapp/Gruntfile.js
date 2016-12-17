'use strict';

var distDir = 'dist';
var distPublicDir = distDir + '/public';

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            dist: {
                src: ['dist']
            }
        },

        mkdir: {
            dist: {
                options: {
                    create: ['dist']
                }
            }
        },

        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'public/',
                    src: ['**/*', '!**/*.js', '!**/*.less'],
                    dest: distPublicDir
                }]
            }
        },

        babel: {
            options: {
                sourceMap: true,
                presets: ['es2015']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'public/',
                    src: ['**/*.js'],
                    dest: distPublicDir
                }]
            }
        },

        less: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'public/stylesheets/',
                    src: '**.less',
                    ext: '.css',
                    dest: distPublicDir + '/stylesheets'
                }]
            }
        },
    });

    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-mkdir');

    grunt.registerTask('clean', ['clean:dist']);
    grunt.registerTask('dist', ['mkdir:dist', 'copy:dist', 'less:dist', 'babel:dist']);
};
