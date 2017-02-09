# Cascading Style Sheets Script Syntax

This document describes the easy to use server-side scripting language that is CSSS. CSSS runs from the top of the script downwards, like any script.

### Functions

There is no way to define a function. It is possible to call predefined functions though. They provide us with the functionality to handle HTTP requests.

```css
send {
	content: "Welcome to my site";
}
```

### Variables

CSSS variables work exactly as shitty as CSS ones. You declare them using the ```--var-name``` syntax and read them like ```var(--var-name)```. For example:

```css
--my-name: "pete";

send {
	content: var(--my-name);
}
```

Variables can contain strings (in single and double quotes), integers and floats, and true/false.

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

### While loop

Much like the if/else blocks, while loops use at-rules.

```css
@while (true) {

}
```

### Comments

Comments are 100% the same as they are in CSS.

```css
/* I'm a comment! */
```
