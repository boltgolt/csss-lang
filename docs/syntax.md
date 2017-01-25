# Cascading Style Sheets Script Syntax

This document describes the easy to use server-side scripting language that is CSSS. CSSS runs from the top of the script downwards, like any script.

### Functions

There is no way to define a function. It is possible to call predefined functions though. They probide us with the funtionality to handle HTTP requests.

```css
send {
	content: "Welcome to my site";
}
```

### Variables

CSSS veriables work exactly as shitty as CSS ones. You declare them using the ```--var-name``` syntax and read them like ```var(--var-name)```. For example:

```css
--my-name: "pete";

send {
	content: var(--my-name);
}
```

### Variable operations

To add strings together or to preform math on variables, use ```calc()```:

```css
--my-age: 30;

send {
	/* Prints "34" */
	content: calc(var(--my-age) + 4);
}
```

### Importing other scripts

Importing works just like it does in CSS, using the ```@import``` at-rule:

```css
@import "otherScript.csss";
```

### If/else blocks

If/else blocks are modified media queries. They take both variables and static values and use the javascript operators.

```css
@if (3 > 5) {

}
@else {

}
```

### Comments

Comments are 100% the same as they are in CSS

```css
/* I'm a comment! */
```
