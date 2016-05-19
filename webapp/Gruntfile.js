'use strict';

var distDir = 'dist';

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
                        src: ['**/*', '!**/*.jsx', '!**/*.less'],
                        dest: distDir + '/public'
                    }
                ]
            }
        },

        less: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'public/stylesheets/',
                    src: '**.less',
                    ext: '.css',
                    dest: distDir + '/public/stylesheets'
                }]
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-mkdir');

    grunt.registerTask('clean', ['clean:dist']);
    grunt.registerTask('dist', ['mkdir:dist', 'copy:dist', 'less:dist']);
};
