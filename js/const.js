/*
 * Copyright (c) 2014, Carnegie Mellon University.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the University nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT
 * HOLDERS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS
 * OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY
 * WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
@namespace Static constants
*/
Const = {};

/**
Crayola colors (list)
*/
Const.COLORS = [
"rgb(127,201,127)", //green (MDS server)
"rgb(190,174,212)", //blue (storage node 1)
"rgb(253,192,134)", //orange (storage node 2)
//"rgb(188,152,95)", //light yellow (NFS server), formerly light yellow "rgb(255,255,153)", 
"rgb(255,255,153)", 
"rgb(56,108,176)",
"rgb(240,2,127)",
"rgb(191,91,23)", //up to here are colorbrewer2.org colors
"rgb(239, 222, 205)", //almond - light orange
"rgb(205, 149, 117)", //brass - dark orange
"rgb(253, 217, 181)", //apricot - light orange 2
"rgb(120, 219, 226)", //aquamarine - light blue
"rgb(135, 169, 107)", //asparagus - light green
"rgb(255, 164, 116)", //tangerine - slightly deeper orange
"rgb(250, 231, 181)", //banana - light orange
"rgb(159, 129, 112)", //beaver - gray
"rgb(253, 124, 110)", //bittersweet - orange
"rgb(172, 229, 238)", //light blue
"rgb(31, 117, 254)", //dark blue
"rgb(162, 162, 208)",
"rgb(102, 153, 204)",
"rgb(13, 152, 186)",
"rgb(115, 102, 189)",
"rgb(222, 93, 131)",
"rgb(203, 65, 84)",
"rgb(180, 103, 77)",
"rgb(255, 127, 73)",
"rgb(234, 126, 93)",
"rgb(176, 183, 198)",
"rgb(255, 255, 153)",
"rgb(28, 211, 162)",
"rgb(255, 170, 204)",
"rgb(221, 68, 146)",
"rgb(29, 172, 214)",
"rgb(188, 93, 88)",
"rgb(221, 148, 117)",
"rgb(154, 206, 235)",
"rgb(255, 188, 217)",
"rgb(253, 219, 109)",
"rgb(43, 108, 196)",
"rgb(239, 205, 184)",
"rgb(110, 81, 96)",
"rgb(206, 255, 29)",
"rgb(113, 188, 120)",
"rgb(109, 174, 129)",
"rgb(195, 100, 197)",
"rgb(204, 102, 102)",
"rgb(231, 198, 151)",
"rgb(252, 217, 117)",
"rgb(168, 228, 160)",
"rgb(149, 145, 140)",
"rgb(28, 172, 120)",
"rgb(17, 100, 180)",
"rgb(240, 232, 145)",
"rgb(255, 29, 206)",
"rgb(178, 236, 93)",
"rgb(93, 118, 203)",
"rgb(202, 55, 103)",
"rgb(59, 176, 143)",
"rgb(254, 254, 34)",
"rgb(252, 180, 213)",
"rgb(255, 244, 79)",
"rgb(255, 189, 136)",
"rgb(246, 100, 175)",
"rgb(170, 240, 209)",
"rgb(205, 74, 76)",
"rgb(237, 209, 156)",
"rgb(151, 154, 170)",
"rgb(255, 130, 67)",
"rgb(200, 56, 90)",
"rgb(239, 152, 170)",
"rgb(253, 188, 180)",
"rgb(26, 72, 118)",
"rgb(48, 186, 143)",
"rgb(197, 75, 140)",
"rgb(25, 116, 210)",
"rgb(255, 163, 67)",
"rgb(186, 184, 108)",
"rgb(255, 117, 56)",
"rgb(255, 43, 43)",
"rgb(248, 213, 104)",
"rgb(230, 168, 215)",
"rgb(65, 74, 76)",
"rgb(255, 110, 74)",
"rgb(28, 169, 201)",
"rgb(255, 207, 171)",
"rgb(197, 208, 230)",
"rgb(253, 221, 230)",
"rgb(21, 128, 120)",
"rgb(252, 116, 253)",
"rgb(247, 143, 167)",
"rgb(142, 69, 133)",
"rgb(116, 66, 200)",
"rgb(157, 129, 186)",
"rgb(254, 78, 218)",
"rgb(255, 73, 108)",
"rgb(214, 138, 89)",
"rgb(113, 75, 35)",
"rgb(255, 72, 208)",
"rgb(227, 37, 107)",
"rgb(238, 32, 77)",
"rgb(255, 83, 73)",
"rgb(192, 68, 143)",
"rgb(31, 206, 203)",
"rgb(120, 81, 169)",
"rgb(255, 155, 170)",
"rgb(252, 40, 71)",
"rgb(118, 255, 122)",
"rgb(159, 226, 191)",
"rgb(165, 105, 79)",
"rgb(138, 121, 93)",
"rgb(69, 206, 162)",
"rgb(251, 126, 253)",
"rgb(205, 197, 194)",
"rgb(128, 218, 235)",
"rgb(236, 234, 190)",
"rgb(255, 207, 72)",
"rgb(253, 94, 83)",
"rgb(250, 167, 108)",
"rgb(24, 167, 181)",
"rgb(235, 199, 223)",
"rgb(252, 137, 172)",
"rgb(219, 215, 210)",
"rgb(23, 128, 109)",
"rgb(222, 170, 136)",
"rgb(119, 221, 231)",
"rgb(255, 255, 102)",
"rgb(146, 110, 174)",
"rgb(50, 74, 178)",
"rgb(247, 83, 148)",
"rgb(255, 160, 137)",
"rgb(143, 80, 157)",
"rgb(255, 255, 255)",
"rgb(162, 173, 208)",
"rgb(255, 67, 164)",
"rgb(252, 108, 133)",
"rgb(205, 164, 222)",
"rgb(252, 232, 131)",
"rgb(197, 227, 132)",
"rgb(255, 174, 66)"
];

//temporary; for Raja's talk
Const.COLORS[0] = "rgb(231,197,44)"; //orange (MDS server)
Const.COLORS[1] = "rgb(96,181,206)"; //blue (storage node 1)
Const.COLORS[2] = "rgb(127,201,127)"; //green (storage node 2)
Const.COLORS[3] = "rgb(210,183,214)"; //purple (NFS server) 
Const.COLORS[4] = "rgb(255,255,153)"; //yellow 

//temporary; for final Pathception submit
//Const.COLORS[0] = "rgb(127,201,127)";