# A Compact Low-Profile Vehicular 5G MIMO Antenna System
Jinyang Cheng, Houtong Qiu, Xiaopeng Shen, Dan Zeng, Meiling Li, Zhiyi Wang, Zixuan Yi

## Abstract
This paper proposes a compact low-profile 5G Multiple-input multiple-output (MIMO) antenna system. The system comprises four antenna elements: two main antennas, and two diversity antennas. The two main antennas are symmetrical to each other, and both cover the identical frequency bands of 700 - 960 MHz and 1710 - 6000 MHz, while the two diversity antennas are also symmetrical to each other and cover the 1710-6000 MHz band.

The proposed main antenna exhibits polarization orientation differences at different frequencies; thus, arranging four antennas enables adjacent antennas to have mutually orthogonal polarizations, thereby achieving low mutual coupling. Moreover, the overall size of the MIMO antenna system is only 74 mm × 74 mm × 11 mm, and the isolation between each antenna exceeds 10 dB.

Experimental test results indicate that the MIMO antenna system performs excellently, meeting the requirements for practical engineering applications, and particularly demonstrates significant size advantages in MIMO antenna applications.

**Index Terms**: 5G MIMO antennas, Miniaturized Low-Profile Antenna Structure, Vehicular Communication.

## I. INTRODUCTION
Multiple-input multiple-output (MIMO) technology is a crucial technology in the field of 5G wireless communication and is widely used in various scenarios, including smartphones and vehicles [1]. Antennas, as critical components in wireless communication systems, are increasingly designed to be hidden in the vehicles to leave aerodynamics and styling undeteriorated [2].

Generally, typical 5G MIMO antenna systems are composed of multiple antennas to achieve elevated transmission rates and superior resistance to interference. Inevitably, this will result in the inability to reduce the spacing between antennas and an increase in coupling. Against this backdrop, it is particularly challenging to design a compact MIMO antenna system and maintain low mutual coupling between internal antennas [3].

At present, numerous designs have emerged to address the issues of the miniaturization of single antennas as well as the compactness of the overall antenna system. Specially, single planar antenna has been successfully miniaturized through a T-shaped quad-ring monopole antenna with a flag-shaped branch on the ground, a multi-arm monopole, or by introducing ring-shaped U-shaped slots on a patch antenna, adding parasitic radiation structures on the patch antenna [4], [5], [6], [7]. Despite their effectiveness, these methodologies often fall short when it comes to covering the whole frequency band for 5G and LTE applications due to their reliance on planar printed configurations.

Further, several three-dimensional antenna designs have demonstrated comprehensive coverage across the required 5G and LTE frequency bands. For example, a three-dimensional antenna capable of covering the 1.7 - 5 GHz band has been introduced [8], unfortunately, its profile is relatively high. One such design, integrating a Vivaldi antenna with a slot monopole [9], has achieved broadband performance with low profile, operating in a broad bandwidth ranging from 698 MHz to 5 GHz. However, it can not provide omnidirectional radiation, which is restricted in practical applications. To break this limitation, an omnidirectional shark-fin antenna with superior size advantages compared to the above literature is proposed, covering the frequency band from 617 MHz to 5 GHz [10]. Despite the advancements highlighted above, it is still notable that these above solutions primarily pertain to single antenna systems, thus they maybe not effective in reducing the overall size if directly applied to MIMO antenna systems.

Recently, several studies have proposed integration schemes for vehicular 5G MIMO multiple antenna systems. Building upon a single miniaturized antenna presented in [10], a 2 × 2 MIMO antenna system mitigates mutual coupling by increasing the separation distance between antennas and adjusting their positioning [11]. Similarly, a 5G shark-fin antenna system, which leverages similar strategies to transition into a MIMO configuration [12]. Although such two antenna systems have done efficient efforts on decoupling, their overall size are still relatively large.

Subsequently, an alternative approach to reduce mutual coupling as well as obtain a compact 2 × 2 MIMO antenna system is carried out through the cross-placement of antennas [13]. However, due to the high height of each antenna itself, this method does not significantly reduce the overall profile of antenna system. To sum up, it is evident that the present 5G MIMO antenna systems, capable of operating within the 5G NR and even LTE frequency bands, still suffer from the predicament of large dimensions or high profile.

In this paper, a compact low-profile vehicular 5G MIMO antenna system is proposed, comprising four antennas: two main antennas (operating within 700 MHz to 960 MHz and 1710 MHz to 6 GHz) and two diversity antennas (operating within 1700 MHz to 5 GHz). Specially, such main antenna is a novel multiband vehicular 5G antenna, which composed of a metal branch, external branches, and a ground. It has a unique working principle, that is, the polarization direction of the antenna varies in different frequency bands. This confers significant advantages when forming a compact low mutual coupling MIMO antenna system.

Meanwhile, to ensure the compactness of the MIMO antenna system and minimize mutual coupling between the four antennas, the four antennas are positioned such that the polarization of each antenna is orthogonal to that of its adjacent antenna. Moreover, the radiation patterns of each antenna are mutually compensated, thus realizing diversity in both radiation pattern and polarization. Compared to conventional MIMO antenna systems, this proposed design exhibits a notable reduction in size, with the final dimension of 74 mm × 74 mm × 11 mm. Meanwhile, simulation and measurement results verify the operational principles and potential applications in the integration of vehicular 5G MIMO communication system.

*This work was supported in part by the National Natural Science Foundation of China under Grant 52207214. (Corresponding author: Zixuan Yi.)*  
Jinyang Cheng, Dan Zeng, Meiling Li, Zixuan Yi are with the School of Communication and Information Engineering, Shanghai University, Shanghai 200444, China (e-mail: yizixuan@shu.edu.cn).  
Houtong Qiu, Zhiyi Wang are with National Key Laboratory of Aerospace Mechanism, Aerospace System Engineering Shanghai.  
Xiaopeng Shen is with Dr. Industrial Robotic Technology Ltd.

## II. DESIGN OF MIMO ANTENNA SYSTEM
The proposed MIMO antenna system consists of two main antennas (operating at 700 - 960 MHz and 1710 - 6000 MHz) and two diversity antennas (operating at 1710 - 6000 MHz), as depicted in Fig. 1. Two main antennas and two diversity antennas are both printed on an FR4 dielectric substrate ($\varepsilon_{r}=4.4$, $tan \delta=0.02$). Main antenna-1 (denoted as Ant1) is placed along $\varphi=45^{\circ}$, main antenna-2 (denoted as Ant2) along $\varphi=135^{\circ}$, while the diversity antennas are positioned along $\varphi=135^{\circ}$ (denoted as Ant3) and $\varphi=45^{\circ}$ (denoted as Ant4), respectively. Ant1 and Ant2 are symmetric with each other along the XOZ plane, except for the intersection, as shown in Fig. 1(d) and (e). Ant3 and Ant4 are completely symmetric with respect to the XOZ plane.

### A. Design of two main antennas
The two main antennas are symmetrical to each other and are both composed of metal branches, external metal branches, and ground elements, shown in Fig. 2. The evolution of Ant1 is shown in Fig. 3. Ant1 is initially designed with metal branches in combination with a ground to function at low-frequency band (from 700 MHz to 960 MHz). Subsequently, the geometry of the ground is altered to incorporate a slot structure alongside the metal branches, thereby facilitating operation at mid-frequency band (from 1710 MHz - 3 GHz). In the final stage, another slot between the two curve edges of ground is introduced, enabling high-frequency band (from 3 GHz to 6 GHz) performance. Fig. 4 shows the current distribution diagram of Ant1 in each frequency band.

![Fig. 1. Schematic diagram and dimensional parameters of the proposed MIMO antenna system (unit: mm)](https://example.com/fig1)  
*(a) Overall view. (b) Top view and key dimensions. (c) Overall side view. (d) Ant1 side view. (e) Ant2 side view.*

#### 1. Low-frequency band operation (700 MHz - 960 MHz)
When operating in the low-frequency band, the main antenna demonstrates a current intensity under the fundamental excitation frequency of 840 MHz, as illustrated in Fig. 4(a). It indicates main antenna radiates through the metal branch. The surface current distribution along the antenna extends over a length of 0.26 times the wavelength. To achieve operation within this limited size, multiple slits are incorporated into the metal branches of main antenna to increase the effective current path length. Additionally, an external metal branch attached to the end further extends its operational bandwidth.

#### 2. Mid-frequency band operation (1710 MHz - 3 GHz)
When operating within the mid-frequency band, a narrow slot structure is comprised of metal branch and curved edge, as depicted in Fig. 3(b). The current distribution diagram under 2560 MHz excitation, shown in Fig. 4(b), indicates that the current is predominantly concentrated on both sides of narrow slot, and it conforms to the current direction of slot radiation. As can be observed from the S-parameter diagram presented in Fig. 3(d), the addition of this slot enables main antenna to operate within the mid-frequency band.

#### 3. High-frequency band operation (3 GHz - 6 GHz)
When operating within high-frequency bands, another wide slot structure is formed between the curved edges of ground, as depicted in Figure 3 (c). The current distribution at 4450 MHz excitation, as illustrated in Fig. 4(c), predominantly concentrated on both sides of the wide slot, and it conforms to the current direction of slot radiation. Therefore, the S parameter in Figure 3 shows that main antenna has an extra high-frequency band operating interval.

![Fig. 2. Diagram of main antenna-1 (Ant1) and S-Parameter](https://example.com/fig2)  
*(a) Structure of Ant1. (b) S-Parameter of two main antennas.*

![Fig. 3. Evolution of the Ant1](https://example.com/fig3)  
*(a) Step 1. (b) Step 2. (c) Step 3. (d) Reflection coefficient.*

![Fig. 4. Current distributions of Ant1 at different frequencies](https://example.com/fig4)  
*(a) 840 MHz (Radiation part: metal branch). (b) 2560 MHz (Radiation part: narrow slot). (c) 4450 MHz (Radiation part: wide slot).*

#### 4. Radiation pattern and polarization characteristics
The vertical polarization (VP) and horizontal polarization (HP) radiation gain pattern of the Ant1 and Ant2 is depicted in Fig. 7(a) to (c). Among these, The VP gain refers to the two-dimensional gain pattern in the plane perpendicular to the polarization direction, whereas the HP gain refers to the two-dimensional gain pattern in the plane parallel to the polarization direction.

- At low-frequency band (from 700 MHz to 960 MHz), the radiation pattern of Ant1 is omnidirectional at $\varphi=135^{\circ}$, due to the orientation of its metal branches at $\varphi=45^{\circ}$. At the same frequency, the radiation pattern of Ant2 exhibits omnidirectional characteristics in the $\varphi=45^{\circ}$ direction.
- Within the mid to high-frequency bands (from 1710 MHz to 6 GHz), the radiation direction of Ant1 aligns with $\varphi=45^{\circ}$, providing coverage from $\varphi=0^{\circ}-90^{\circ}$. Conversely, the radiation direction of Ant2 is aligned with $\varphi=45^{\circ}$, ensuring coverage from $\varphi=-90^{\circ}-0^{\circ}$. By introducing Ant2, radiation pattern and polarization diversity is achieved.

### B. Design of two diversity antennas
To mitigate the effect of fading and enhance the quality of signal transmission, MIMO systems typically adopt the techniques of diversity transmission and reception [14]. Consequently, two diversity antennas are designed for the mid-high frequency band (from 1710 MHz to 6 GHz) to participate in diversity transmission and reception. Additionally, these antennas can also compensate for the radiation range of the mid-high frequency band of main antennas.

Both two diversity antennas are printed on the substrate, and they are symmetric with respect to the XOZ plane. Ant4 is placed along $\varphi=135^{\circ}$, while Ant3 and Ant4 are placed symmetrically with each other, as depicted in Fig. 5, the S-Parameters of both diversity antennas are presented simultaneously. The radiation patterns of two diversity antennas are illustrated in Fig. 7(d) and (e). The design of the diversity antenna is derived from the planar monopole [15].

![Fig. 5. Diagram of Diversity antenna (Ant4) and S-Parameter](https://example.com/fig5)  
*(a) Structure of Ant4. (b) S-Parameter of two diversity antennas.*

### C. Design of MIMO Antenna System arrangement
To maintain the compactness of the MIMO antenna system as well as obtain low mutual coupling between the four antennas, the positions of the four antennas are arranged, such that their polarization directions are perpendicular to those of the adjacent antennas. Based on the principles described in Section II-A, the polarization direction of each antenna at each frequency can be analyzed as follows:

1. **Low-frequency band (700 MHz - 960 MHz)**: The polarization direction of Ant1 is along $\varphi=45^{\circ}$, while the polarization direction of Ant2 is along $\varphi=135^{\circ}$, as illustrated in Fig. 6(a). Their polarization are mutually perpendicular, thus reducing the coupling between the two antennas.
2. **Mid-frequency band (1710 MHz - 3 GHz)**: The polarization directions of Ant1, Ant2, Ant3, and Ant4 are along $\varphi=135^{\circ}$, $\varphi=45^{\circ}$, $\varphi=45^{\circ}$, and $\varphi=135^{\circ}$, respectively, as depicted in Fig. 6(b). The polarization directions of the four antennas are maintained to be perpendicular to their adjacent antennas.
3. **High-frequency band (3 GHz - 6 GHz)**: The polarization direction of each antenna is also implemented to be perpendicular to that of its adjacent antennas as shown in Fig. 6(c). Consequently, the mutual coupling in the mid-to-high frequency band is also very small. The isolation between ports is illustrated in Fig. 8(b).

![Fig. 6. Schematic diagrams of the polarization directions of each part of the proposed MIMO antenna system at various frequencies](https://example.com/fig6)  
*(a) 840 MHz. (b) 2560 MHz. (c) 4450 MHz.*

## III. EXPERIMENTAL VERIFICATION
To validate the proposed 5G MIMO antenna system, a prototype is constructed as illustrated in Fig. 9. All antennas and grounds are printed on an FR4 substrate, and coaxial feedings are employed for excitation. Subsequently, the performance indicators of the MIMO antenna system are tested and the results are obtained. In the actual measurement process, the remaining non-measurement ports are connected to a 50 Ω matching load.

### A. S-parameters measurement
The S-parameters are measured using a vector network analyzer. As illustrated in Fig. 8(a):
- The 6 dB return loss (RL) bandwidth of main antenna-1 (Ant1) and main antenna-2 (Ant2) covers the ranges of 700 MHz to 960 MHz and 1710 MHz to 6 GHz.
- The 6 dB RL bandwidth of the diversity antenna-1 (Ant3) and diversity antenna-2 (Ant4) spans from 1710 MHz to 6 GHz.

The isolation between the various antennas within the proposed MIMO antenna system is depicted in Fig. 8(b), with isolation between each port exceeding 10 dB (Greater than 15 dB in the high-frequency band).

### B. Radiation pattern measurement
Fig. 7 displays the gain patterns for Ant1, Ant2, Ant3, and Ant4, in accordance with the theoretical explanations outlined in this paper. By observing the gain patterns of the four antennas:
- In the low-frequency band, Ant1 and Ant2 achieve diversity in the radiation pattern as shown in Fig. 7(f).
- In the mid-frequency and high-frequency bands, Ant1, Ant2, Ant3, and Ant4 collectively realize diversity in the radiation pattern as shown in Fig. 7(g) to (j).

Consequently, the entire MIMO antenna system is capable of supporting signal transmission and reception in all directions.

![Fig. 7. Simulated and measured gain patterns of MIMO antenna system](https://example.com/fig7)  
*Simulation results: (a) 840 MHz. (b) 2560 MHz. (c) 4450 MHz. (d) 2560 MHz. (e) 4450 MHz; Measurement result: (f) 840 MHz. (g) 2560 MHz. (h) 4450 MHz. (i) 2560 MHz. (j) 4450 MHz.*

### C. Envelope Correlation Coefficient (ECC)
In MIMO antenna systems, another crucial metric is the Envelope Correlation Coefficient (ECC), which serves as a characterization and evaluation reference for assessing the independence of antennas within the system. The ECC can be computed in a simplified manner using S-parameters [16]. At the operating frequencies, the ECC meets the requirements for this indicator in MIMO communication (ECC < 0.5) [17], as shown in Fig. 8(c).

![Fig. 8. Measured reflection coefficient, isolation and envelop correlation coefficient of antennas](https://example.com/fig8)  
*(a) Reflection coefficient, (b) Isolation, (c) Envelope correlation coefficient between ports.*

### D. Antenna efficiency
The efficiency graphs of the proposed 5G MIMO antenna system is provided in Fig. 9. Efficiency exceeding 40% is achieved for each antenna, with an average simulated efficiency of 64.8%. Discrepancies between simulated and measured results are primarily attributed to measurement chamber inaccuracies and significant high-frequency losses in the vehicular cable harness, resulting in a measured average efficiency of 53.1%.

By measuring various parameters of the proposed MIMO antenna system, it can be confirmed that the designed MIMO antenna system is in accordance with the theoretical introduction presented in this paper and is suitable for vehicular communications within the 5G and LTE frequency bands.

![Fig. 9. Antennas efficiency](https://example.com/fig9)  
*(a) Ant1 and Ant2. (b) Ant3 and Ant4.*

![Fig. 10. Measurement environment for MIMO antenna system performance and physical prototype of MIMO antenna system](https://example.com/fig10)

### E. Performance comparison with other literatures
By comparing with Table 1 and relevant literatures in recent years, the 5G MIMO antenna system proposed in this paper not only covers an excellent working bandwidth, but also has significant advantages in overall size.

**TABLE I PERFORMANCE COMPARISON WITH OTHER LITERATURES**

| Refs | Work Freq(MHz) | Antenna Number | Isolation (dB) | Overall Size(mm³) |
| --- | --- | --- | --- | --- |
| [19] | 698-960 & 1710-2690 | 2 | 6-10 | 80 × 60 × 2 |
| [13] | 698-960 & 1700-2700 | 2 | 6-10 | 65 × 52 × 50 |
| [12] | 617-960 & 1710-6000 | 4 | 6-10 | 180 × 80 × 65 |
| [11] | 617-960 & 1700-5000 | 4 | 10-15 | 170 × 55 × 60 |
| [20] | 700-960 & 1710-6000 | 4 | 6-15 | 152 × 152 × 20 |
| [18] | 1710-5000 | 2 | 16 | 80 × 30 × 27 |
| This Work | 700-960 & 1710-6000 | 4 | 10-15 | 74 × 74 × 11 |

## IV. CONCLUSION
This paper proposes a compact low-profile vehicular 5G MIMO antenna system consisting of four types of antennas: two main antennas and two diversity antennas. The main antennas operate in the low-frequency band (700 - 960 MHz) and the mid-to-high frequency band (1710 MHz - 6 GHz), offering excellent frequency band coverage. The diversity antennas operate in the mid-to-high frequency band (1710 MHz - 6 GHz), with an impedance bandwidth of -6 dB (VSWR 3:1).

By leveraging the unique operating mechanism of the main antenna to enable mutually orthogonal polarizations for adjacent antennas, the proposed MIMO antenna system achieves an ultra-compact size of only 74 mm × 74 mm × 11 mm, with isolation between each antenna exceeding 10 dB. The compact structure of this MIMO antenna system facilitates installation in vehicles, and its design concept provides effective reference for the miniaturization of MIMO antenna systems.

## REFERENCES
[1] S. Hakak, T. R. Gadekallu, P. K. R. Maddikunta, et al., “Autonomous vehicles in 5G and beyond: A survey,” Veh. Commun., vol. 39, Art. no. 100551, Feb. 2023.  
[2] R. J. Langley and J. C. Batchelor, “Hidden antennas for vehicles,” Electron. Commun. Eng. J., vol. 14, no. 6, pp. 253–262, Dec. 2002.  
[3] S. K. Ibrahim, J. M. Singh, S. S. Al-Bawri, et al., “Design, Challenges and Developments for 5G Massive MIMO Antenna Systems at Sub 6-GHz Band: A Review,” Nanomaterials, vol. 13, Art. no. 520, Feb. 2023.  
[4] S. A. Balakrishnan, P. Devisowjanya, R. K. A. Ram, et al., “Implementation of Low-Profile Multiband Planar Antenna for Internet of Vehicle Communication,” Wireless Pers. Commun., vol. 138, no. 1, pp. 229–243, Sep. 2024.  
[5] A. Michel, P. Nepa, M. Gallo, et al., “Printed Wideband Antenna for LTE-Band Automotive Applications,” IEEE Antennas Wireless Propag. Lett., vol. 16, pp. 1245–1248, 2017.  
[6] M. Kanagasabai, Shanmuganathan, Shanmathi, et al., “Novel Low Profile Beam Switchable 5G Sub-6 GHz E-GSM Antenna for Vehicular Communication,” Int. J. Electron., vol. 111, no. 10, pp. 1742–1759, Oct. 2024.  
[7] M. Kanagasabai, S. Shanmuganathan, M. G. N. Alsath, et al., “A Novel Low-Profile 5G MIMO Antenna for Vehicular Communication,” Int. J. Antennas Propag., vol. 2022, Art. no. 9431221, 2022.  
[8] S. Shuai, H. Su, Y. Jiao, et al., “Ultra-Wideband Omnidirectional Antenna with Stable Radiation Patterns Using CMA,” IEEE Trans. Veh. Technol., vol. 73, no. 7, pp. 10788–10792, Jul. 2024.  
[9] Y. Hua, L. Huang, and Y. Lu, “A Compact 3-Port Multiband Antenna for V2X Communication,” in Proc. IEEE Int. Symp. Antennas Propag. USNC/URSI Nat. Radio Sci. Meeting, Jul. 2017, pp. 639–640.  
[10] M. O. Khalifa, A. M. Yacoub, and D. N. Aloi, “A Multiwideband Compact Antenna Design for Vehicular Sub-6 GHz 5G Wireless Systems,” IEEE Trans. Antennas Propag., vol. 69, no. 12, pp. 8136–8142, Dec. 2021.  
[11] M. Khalifa, A. Yacoub, and D. Aloi, “Compact 2x2 and 4x4 MIMO Antenna Systems for 5G Automotive Applications,” Appl. Comput. Electromagn. Soc., vol. 36, no. 6, pp. 762–778, Aug. 2021.  
[12] Y. Zhou, T. Jiang, H. Li, and F. Chen, “A 5G MIMO Multiband Low-Profile Antenna Design for Automotive Shark-Fin Systems,” IEEE Antennas Wireless Propag. Lett., vol. 23, no. 5, pp. 1588–1592, May 2024.  
[13] D. Preradovic and D. N. Aloi, “Cross polarized 2x2 LTE MIMO system for automotive shark fin application,” Appl. Comput. Electromagn. Soc., vol. 35, no. 10, pp. 1207–1216, Oct. 2020.  
[14] X. Zhang, Z. Lv and W. Wang, ”Performance Analysis of Multiuser Diversity in MIMO Systems with Antenna Selection,” IEEE Trans. Wireless Commun., vol. 7, no. 1, pp. 15-21, Jan. 2008  
[15] A. Abdulbari et al., “Single-Layer Planar Monopole Antenna-Based Artificial Magnetic Conductor (AMC),” Int. J. Antennas Propag., vol. 2022, Art. no. 6724175, 2022.  
[16] I. Nadeem and D.-Y. Choi, “Study on Mutual Coupling Reduction Technique for MIMO Antennas,” IEEE Access, vol. 7, pp. 563–586, 2019.  
[17] R. Mathur, K. Roy, P. O. singh Lamba, and P. Lamba, “SQUARE SPLIT RING MIMO ANTENNA FOR WIMAX /WLAN APPLICATIONS WITH REDUCED ECC,” Int. J. Adv. Res. Eng. Technol., vol. 8, no. 6, pp. 65–72, Aug. 2020.  
[18] A. M. Yacoub, M. O. Khalifa, and D. N. Aloi, “Wide Band Raised Printed Monopole for Automotive 5G Wireless Communications,” IEEE Open J. Antennas and Propag., vol. 3, pp. 502–510, 2022.  
[19] L. Shen, W. Luo, Y. Miao, and G. Liu, “Combined Shark-Fin Rooftop Antenna for LTE, WLAN and BeiDou Applications,” Electronics, vol. 13, no. 7, Art. no. 7, Jan. 2024.  
[20] J.-K. Che, C.-C. Chen, and J. F. Locke, “A Compact Four-Channel MIMO 5G Sub-6 GHz/LTE/WLAN/V2X Antenna Design for Modern Vehicles,” IEEE Antennas Wireless Propag. Lett., vol. 69, no. 11, pp. 7290–7297, Nov. 2021.