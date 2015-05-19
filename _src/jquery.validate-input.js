/**
 *
 * Validate Input
 * @author Darren Labithiotis
 * @version 0.0.3
 *
 */

!(function (window, document, undefined) {

	/** ====================  STRING EXTENDS  ==================== **/
	String.prototype.setCharAt = function (index /* Index */, string /* string */, range /* range to replace */) {
		if (index != null && string) {
			return '' + ((index > 0 ? this.substr(0, index) : '') + string + this.substr(range ? index + range : index + 1, this.length));
		} else {
			return this.toString()
		}
	};

	String.prototype.insertAt = function (index /* Index */, s /* String */) {
		if (index != null && s) {
			return '' + this.slice(0, index) + s + this.slice(index + this.length);
		} else {
			return this.toString()
		}
	};

	var Validate = function (element, options) {

		element._value = element.value;

		this.$element = $(element);
		this.value    = element._value;
		this.options  = {
			debug: false,
			maxLength: 60,
			showMaxLength: typeof options.maxLength === 'number',
			showMaxLengthSecondary: options.type != 'maxLength',
			type: '',
			symbol: '£',
			allowMetaKeys: true, // If you allow meta key inputs (like ctrl + a, arrow keys)
			postValidateDelay: 200,
			errorClass: 'error',
			addedErrorClass: true
		};
		this.options  = $.extend(this.options, options);
		this.init();

	};

	Validate.prototype = {

		addKeyEvent: function (fn) {
			this.$element.off('keypress.validate', fn.bind(this)).on('keypress.validate', fn.bind(this));
			this.$element.off('onkeydown.validate', this.deleteKeys.bind(this)).on('keydown.validate', this.deleteKeys.bind(this));
		},

		addChangeEvent: function (fn) {
			this.$element.off('change.validate', fn.bind(this)).on('change.validate', fn.bind(this));
		},

		log: function (msg) {
			if (this.options.debug) {
				var args = Array.prototype.slice.call(arguments);
				args.unshift('JVI:');
				console.log.apply(console, args);
			}
		},

		init: function () {

			switch (this.options.type) {
				case ('numbers'):
					this.validateNumbers();
					break;
				case ('letters'):
					this.validateLetters();
					break;
				case ('numbersAndLetters'):
					this.validateNumbersAndLetters();
					break;
				case ('price'):
					this.validatePrice();
					break;
				case ('pin'):
					this.validatePin();
					break;
				case ('phone'):
					this.validatePhone();
					break;
				case ('percentage'):
					this.validatePercentage();
					break;
				case ('time'):
					this.validateTime();
					break;
				case ('maxLength'):
					this.validateMaxLength();
					break;
			}

			if(this.options.showMaxLength && this.options.type != 'maxLength') this.validateMaxLength();

		},

		test: function (evt /* Event */, re /* Regex for test */, cb /* Callback (event, key) */) {

			var regExp = re || this.$element[0]._testRegExp;

			if (!regExp || !regExp instanceof RegExp) return;

			var e   = evt || window.event,
				key = String.fromCharCode(e.keyCode || e.which);

			this.log('"' + key + '"', 'key pressed');

			this.$element[0]._testRegExp = regExp;

			if (cb instanceof Function) window.setTimeout(function () {
				cb.call(this, e, key);
			}.bind(this), 1);

			if (e.metaKey && this.options.allowMetaKeys) return true;

			if (!regExp.test(key)) {
				this.log('Invalid key pressed: ' + key);
				if (e.preventDefault) e.preventDefault();
				return e.returnValue = false;
			}

		},

		postValidate: function (re /* Regex */, cb /* Callback (valid) */) {

			this.log('Post validate input');

			if(this.options.showMaxLength) window.setTimeout(this.updateMaxCountIndicator.bind(this), 20);

			var valid  = true,
				regExp = re || this.$element[0]._postValidateRegExp;

			if (!regExp || !regExp instanceof RegExp) {
				if (cb instanceof Function) return cb.call(this, valid);
				return;
			}

			this.$element[0]._postValidateRegExp = regExp;

			window.setTimeout(function () {

				valid = regExp.test(this.$element.val());

				if (this.options.addedErrorClass) {
					if (!valid) {
						this.log('Input value is invalid: "' + this.$element.val() + '"');
						this.$element.addClass(this.options.errorClass);
					} else {
						this.$element.removeClass(this.options.errorClass);
					}
				}

				this.$element[0].setCustomValidity(!valid ? 'This field has invalid contents!' : null);

				if (cb instanceof Function) return cb.call(this, valid);

			}.bind(this), this.options.postValidateDelay);

		},

		deleteKeys: function (evt) {
			var e = evt || window.event;
			if (e.keyCode == 8 || e.keyCode == 46) {
				window.setTimeout(this.postValidate.bind(this), 1);
			}
		},

		updateMaxCountIndicator: function() {
			this.log('Max length updateCount, value ==', this.$element[0].value);
			var len = this.$element[0].value.length;
			if (len >= this.options.maxLength && !this.options.showMaxLengthSecondary) {
				this.$counter.html(this.options.maxLength + '/' + this.options.maxLength).addClass('invalid');
			} else {
				this.$counter.html(len + '/' + this.options.maxLength).removeClass('invalid');
			}
		},

		validateMaxLength: function () {

			this.log('Add validate max length.');

			var _this    = this,
				$wrapper = $('<div class="validate-wrapper" style="position:relative;"></div>'),
				$counter = this.$counter = $('<div class="validate-counter">' + this.$element[0].value.length + '/' + this.options.maxLength + '</div>');

			function validateEvent(evt) {

				var e            = evt || window.event,
					regexActions = /^(37|38|39|40|46|27|13|8|9|16|17|18|20)$/,// Left, Up, Right, Down, Delete, Escape, Enter, Backspace, Tab, Shift, Ctrl, Alt, Caps
					validInput   = regexActions.test(e.keyCode);//&& !e.shiftKey;

				if (_this.$element[0].value.substring(e.target.selectionStart, e.target.selectionEnd).length != 0) {
					_this.log('Allow input as it\'s highlighted text.');
					window.setTimeout(_this.updateMaxCountIndicator.bind(_this), 20);
					return true;
				}

				if (e.metaKey && this.options.allowMetaKeys) {
					window.setTimeout(_this.updateMaxCountIndicator.bind(_this), 20);
					return true;
				}

				if (_this.$element[0].value && _this.$element[0].value.length >= _this.options.maxLength && !validInput) {
					if (e.preventDefault) e.preventDefault();
					return e.returnValue = false;
				}

				// Need timeout to get correct count of value length
				window.setTimeout(_this.updateMaxCountIndicator.bind(_this), 20);

			}

			// limiter
			this.$element.on('blur', function () {
				this.value = this.value.substr(0, _this.options.maxLength)
			});

			this.$element.wrap($wrapper);
			this.$element.parent().append($counter);

			this.addKeyEvent(validateEvent);

		},

		validateNumbers: function () {

			this.log('Add validate numbers.');

			this.addKeyEvent(function (evt) {
				this.test.call(this, evt, /[\d]/);
			});

		},

		validateLetters: function () {

			this.log('Add validate letters.');

			this.addKeyEvent(function (evt) {
				this.test.call(this, evt, /[\w]/);
			});

		},

		validateNumbersAndLetters: function () {

			this.log('Add validate numbers and letters.');

			this.addKeyEvent(function (evt) {
				this.test.call(this, evt, /[\w\d]/);
			});

		},

		validatePhone: function () {

			this.log('Add validate phone.');

			this.addKeyEvent(function (evt) {
				this.test.call(this, evt, /[\d\-\+\(\)\s]/, function (e, key) {
					this.postValidate(/^[\+\d\-\(\)]+(?: [\d\-\s]+){0,4}$/gi);
				});
			});

		},

		validatePin: function () {

			this.log('Add validate pin.');

			this.addKeyEvent(function (evt) {
				this.test(evt, /^[\d]{0,3}$/, function (e, key) {
					this.postValidate(/^[\d]{3}$/);
				});
			});

		},

		validatePrice: function () {

			this.log('Add validate price.');

			function validateEvent(evt) {
				var e       = evt || window.event,
					key     = String.fromCharCode(e.keyCode || e.which),
					val     = e.target.value,
					pos     = e.target.selectionStart,
					divider = val.match(/\./gi),
					pennies = val.match(/\.(.*)/gi),
					regExp  = /[\d\.]/;

				if (e.metaKey && this.options.allowMetaKeys) return true;

				if (!regExp.test(key) && key != this.options.symbol) {
					this.log('Invalid key pressed: ' + key);
					if (e.preventDefault) e.preventDefault();
					return e.returnValue = false;
				}

				if (key == '.' && divider && divider.length > 0) {
					this.log('Input already has one period');
					if (e.preventDefault) e.preventDefault();
					return e.returnValue = false;
				}

				if (val.match(this.options.symbol) && // if currency symbol is present
					pos < this.options.symbol.length &&  // if position is less than the length of currency symbol
					!(e.keyCode == 37) && // if left key was pressed
					!(e.target.selectionEnd - e.target.selectionStart > 0)) // Check if the field is selected (blue highlighted)
				{
					this.log('Can\'t insert anything before currency symbol');
					if (e.preventDefault) e.preventDefault();
					return e.returnValue = false;
				}

				if ((pennies && pennies[0].length > 2 && pos >= val.length - 2) || val == '') {

					this.log('Can only insert pennies to 2 decimal places');

					e.target.value = val.setCharAt(pos >= val.length ? pos - 1 : pos, key);

					$(e.target).one('blur', function () {
						$(e.target).trigger('change')
					});

					if (e.preventDefault) e.preventDefault();
					return e.returnValue = false;

				}

			}

			function updateVal() {
				var val                 = this.$element.val().replace(/[^\d\.]+/g, ''),
					segments            = val.split('.'),
					pounds              = segments[0].replace(/^0+/, ''),
					pennies             = segments[1] ? segments[1].length < 2 ? segments[1] + '0' : segments[1] : '';
				this.$element[0]._value = (pounds == '' ? '0' : pounds) + (segments[1] ? '.' + pennies : '.00');
				this.$element.val(val == '' ? '' : this.options.symbol + this.$element[0]._value);
			}

			this.addKeyEvent(validateEvent.bind(this));
			this.addChangeEvent(updateVal.bind(this));

			updateVal.bind(this).call();

			// Add currency symbol if field is empty

			function addSymbol() {
				if (this.$element.val() == '') {
					this.$element.val(this.options.symbol);
				}
			}

			this.$element.on('focus', addSymbol.bind(this));

			// Remove currency symbol if field is just symbol

			function removeSymbol() {
				if (this.$element.val() == this.options.symbol) {
					this.$element.val('');
				}
			}

			this.$element.on('blur', removeSymbol.bind(this));

		},

		validatePercentage: function () {

			this.log('Add validate percentage.');

			this.addKeyEvent(function (evt) {
				this.test.call(this, evt, /[\d%\.]/);
			});

			function updateVal() {
				var val                 = this.$element.val().replace('%', '');
				this.$element[0]._value = val;
				this.$element.val(val == "" ? "" : val + '%');
			}

			this.addChangeEvent(updateVal.bind(this));

			updateVal.call(this);

		},

		validateTime: function () {

			this.log('Add validate time.');

			var currentVal = this.value;

			function validateEvent(evt) {
				var e          = evt || window.event,
					key        = String.fromCharCode(e.keyCode || e.which),
					val        = e.target.value,
					pos        = e.target.selectionStart,
					divider    = val.match(/:/gi),
					minutes    = val.match(/:(.*)/gi),
					regexChars = /[\d]/;

				currentVal = val;

				if (e.metaKey && this.options.allowMetaKeys) return parseTime(val);

				if (regexChars.test(key) && !divider && val.length >= 2 && val.length < 5) {
					// Add Divider
					this.log('Add time divider');
					e.target.value = val.insertAt(2, ':');

				} else if (regexChars.test(key) && val.length >= 5) {
					// Max Length, replace next char
					this.log('Max length for time reached');
					e.returnValue = false;
					if (e.preventDefault) e.preventDefault();
					pos            = (pos == 2 ? 3 : (pos >= 5 ? 4 : pos));
					e.target.value = parseTime(val.setCharAt(pos, key));
					e.target.setSelectionRange(pos + 1, pos + 1);


				} else {
					if (!regexChars.test(key) || ( minutes && minutes[0].length > 2 )) {
						// Invalid Character or more than 2 numbers after divider
						this.log('Invalid Character pressed');
						e.returnValue = false;
						if (e.preventDefault) e.preventDefault();
					}
				}
			}

			function parseTime(val) {

				this.log('Parse time');

				// check val length and pad if less than 4
				while (val.length < 4) {
					val = '0' + val;
				}

				var segments,
					hours,
					hourDigits,
					minutes,
					minuteDigits,
					time;

				segments = val.match(/\d/gi);
				hours    = (segments[0] || 0) + (segments[1] || 0);
				minutes  = (segments[2] || 0) + (segments[3] || 0);

				// Get first 2 chars if the time is longer than 2 characters
				if (hours && hours.length > 2) hours = hours.substr(0, 2);
				// Pad
				if (hours && hours.length == 0 || !hours) hours = '00';
				if (hours && hours.length == 1) hours = '0' + hours;

				// Get first 2 chars if the time is longer than 2 characters
				if (minutes && minutes.length > 2) minutes = minutes.substr(0, 2);
				// Pad
				if (minutes && minutes.length == 0 || !minutes) minutes = '00';
				if (minutes && minutes.length == 1) minutes = '0' + minutes;

				// Get Hour Digits
				hourDigits = hours.split('');

				// Get Minute Digits
				minuteDigits = minutes.split('');

				// Create Time
				time = hours + ':' + minutes;

				if (minuteDigits[0] >= 6) {
					time = hours + ':59';
				}

				if (hourDigits[0] >= 3 || ( hourDigits[0] >= 2 && hourDigits[1] >= 4 )) {
					time = '23:59';
				}

				return time;

			}

			function updateVal() {
				this.log('Update Value of input');
				var val                 = this.$element.val();
				this.$element[0]._value = val;
				this.$element.val(val == "" ? "" : parseTime(val));

			}

			function hasChanged() {
				if (this.value != currentVal) {
					this.$element.trigger('change');
				}
			}

			this.$element.on('blur', hasChanged.bind(this));

			this.addKeyEvent(validateEvent.bind(this));
			this.addChangeEvent(updateVal.bind(this));

			updateVal.bind(this).call();

		}

	};

	$.fn.validateInput = function (option) {

		this.each(function () {
			if (option instanceof Object) {
				this._validate = new Validate(this, option);
				return this;
			} else {
				var options    = {type: option};
				this._validate = new Validate(this, options);
				return this;
			}
		});

		return this;

	};

}(window, document, undefined));