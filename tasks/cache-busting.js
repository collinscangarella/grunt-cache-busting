module.exports = function (grunt) {
	var fs     = require('fs'),
		path   = require('path'),
		crypto = require('crypto'),
		glob = require('glob'),
		gruntTextReplace = require('grunt-text-replace/lib/grunt-text-replace');

	grunt.registerMultiTask('cache-busting', 'Cache bust file and update references', function() {
		var filesToReplace = grunt.file.expand(this.data.file, 'isFile');
		var hasReplacement = this.data.replacement !== undefined;
		for (var i = 0; i < filesToReplace.length; i++) {
			var replacement;
			if (hasReplacement) {
				replacement = this.data.replacement
			} else {
				replacement = path.basename(filesToReplace[i]);
			}
			var fileContents = grunt.file.read(filesToReplace[i]),
				hash = crypto.createHash('md5').update(fileContents).digest("hex"),
				outputDir = path.dirname(filesToReplace[i]),
				fileExtension = path.extname(filesToReplace[i]),
				replacementExtension = path.extname(replacement),
				replacementWithoutExtension = replacement.slice(0, replacement.length - replacementExtension.length),
				outputFile = outputDir + path.sep + replacementWithoutExtension + "-" + hash + fileExtension;

			if (this.data.get_param){

				gruntTextReplace.replace({
					src: this.data.replace,
					overwrite: true,
					replacements: [{
						from: new RegExp(replacement + "(\\?v=)?([a-z0-9]+)*"),
						to: replacement + "?v=" + hash
					}]
				});

			} else {
				if (this.data.cleanup) {
					var files = glob.sync(outputDir + path.sep + replacementWithoutExtension + "-*" + fileExtension);
					files.forEach(function(file){
						fs.unlink(file);
					})
				}
				fs.rename(filesToReplace[i], outputFile);
				var from;
				if (this.data.matchHashed === undefined || this.data.matchHashed) {
					from = replacementWithoutExtension + (replacementExtension ? "((\-?)(.+)*)" + replacementExtension : '');
				} else {
					from = replacementWithoutExtension + replacementExtension;
				}
				gruntTextReplace.replace({
					src: this.data.replace,
					overwrite: true,
					replacements: [{
						from: new RegExp(from),
						to: replacementWithoutExtension + "-" + hash + replacementExtension
					}]
				});

			}
		}
	});
};
