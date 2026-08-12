import test from "node:test";
import assert from "node:assert/strict";
import { hostnameOf, toMatchPatterns } from "../src/lib.js";

test("hostnameOf extracts the hostname from http(s) URLs", () => {
  assert.equal(hostnameOf("https://myflixerfree.to/watch/123"), "myflixerfree.to");
  assert.equal(hostnameOf("http://ads.example.com:8080/x"), "ads.example.com");
  assert.equal(hostnameOf("https://sub.domain.example.com/"), "sub.domain.example.com");
});

test("hostnameOf rejects non-http(s) schemes", () => {
  assert.equal(hostnameOf("chrome://extensions"), null);
  assert.equal(hostnameOf("chrome-extension://abcdef/popup.html"), null);
  assert.equal(hostnameOf("about:blank"), null);
  assert.equal(hostnameOf("file:///Users/ramith/x.html"), null);
});

test("hostnameOf returns null for unparseable input", () => {
  assert.equal(hostnameOf(""), null);
  assert.equal(hostnameOf("not a url"), null);
  assert.equal(hostnameOf(undefined), null);
});

test("toMatchPatterns covers the bare domain and all subdomains", () => {
  assert.deepEqual(toMatchPatterns("myflixerfree.to"), [
    "*://myflixerfree.to/*",
    "*://*.myflixerfree.to/*",
  ]);
});
