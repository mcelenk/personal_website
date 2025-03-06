import React from 'react';
import '../styles/Common.css';

const CV: React.FC = () => {
    return (
        <div className='text-container'>
            <h1>Curriculum Vitae</h1>

            <section>
                <p>Mustafa Çelenk</p>
                <p>1018CX, Amsterdam, The Netherlands</p>
                <p><a href="mailto:mcelenk@dottilde.com" className='email-link'>mcelenk@dottilde.com</a></p>
            </section>

            <section>
                <h2>Experience</h2>
                <ul>
                    <li>
                        <strong>Software Engineer</strong>
                        <p><em>Meta Inc., Amsterdam, April 2022 - February 2024</em></p>
                        <p>Key Responsibilities:</p>
                        <ul>
                            <li>Worked collaboratively with a team to craft and evaluate various privacy policies at a pivotal point within the Privacy Infra organization.</li>
                            <li>Played a key role in developing lifecycle management solutions tailored for privacy policies.</li>
                            <li>Contributed to an internal application designed to streamline policy infrastructure adoption, significantly optimizing operational workflows and enhancing engineering velocity by a factor of four.</li>
                            <li>Developed a code snippet generator as part of the adoption initiatives, increasing accessibility for users.</li>
                        </ul>
                    </li>
                    <hr />
                    <li>
                        <strong>Developer</strong>
                        <p><em>Booking.com, Amsterdam, September 2018 - March 2022</em></p>
                        <p>Key Responsibilities:</p>
                        <ul>
                            <li>Enhanced monitoring capabilities within Booking.com's mobile booking process, ensuring heightened performance and reliability.</li>
                            <li>Contributed to development of solutions for bringing more clarity to customers about the payment and cancellation policies offered, collaborating with technical writers, designers as well as fellow engineers and leads.</li>
                            <li>Assisted in replatforming efforts of policy retrieval solutions.</li>
                            <li>With fellow engineers, replatformed the validation phase of the book process.</li>
                        </ul>
                    </li>
                    <hr />
                    <li>
                        <strong>Software Developer</strong>
                        <p><em>Netcad Yazilim A.Ş., Ankara, November 2016 - August 2018</em></p>
                        <p>Key Responsibilities:</p>
                        <ul>
                            <li>Conducted research and analysis to identify suitable NoSQL solutions for an IoT project involving a consortium of European companies.</li>
                            <li>Selected and integrated Cassandra as the NoSQL database solution, meeting the project's requirements for scalability and performance.</li>
                            <li>Enhanced legacy authorization systems by integrating social sign-in capabilities for cross-application authorization.</li>
                            <li>Assumed maintenance responsibilities for the building block project of NetgisServer, ensuring its stability and reliability.</li>
                        </ul>
                    </li>
                    <hr />
                    <li>
                        <strong>Technical Team Lead</strong>
                        <p><em>NKR Yazılım Danışmanlık Sanayi ve Ticaret Ltd.Şti., Ankara, May 2012 - November 2016</em></p>
                        <p>Key Responsibilities:</p>
                        <ul>
                            <li>Led a team of developers in the design, development, and maintenance of accounting applications for the National Social Security Administration.</li>
                            <li>Developed and optimized stored procedures for efficient processing of high-volume data.</li>
                            <li>Implemented user interface enhancements using JavaScript and ExtJS, improving the usability and aesthetics of the applications.</li>
                            <li>Participated in code reviews and provided mentorship to junior developers to foster their professional growth.</li>
                            <li>Acted as a liaison between the development team and clients, ensuring clear communication and understanding of project requirements.</li>
                        </ul>
                    </li>
                    <hr />
                    <li>
                        <strong>Software Developer</strong>
                        <p><em>Netcad Yazilim A.Ş., Ankara, May 2008 - May 2012</em></p>
                        <p>Key Responsibilities:</p>
                        <ul>
                            <li>Developed platforms for performance testing of web services and network analysis modules using C#, Pascal, and the MSTest suite.</li>
                            <li>Contributed to the development of GloNet and NETIGMA frameworks, which allowed the creation of GIS-aware web applications without the need for coding.</li>
                            <li>Worked with cross-functional teams to design and implement innovative solutions to complex problems.</li>
                            <li>Championed the integration of code reviews into the publishing phase. Authored a coding standards document for the department, gathering feedback from engineers to ensure alignment and adoption.</li>
                        </ul>
                    </li>
                    <hr />
                    <li>
                        <strong>Software Developer</strong>
                        <p><em>AirTies Wireless Networks, Istanbul, September 2006 - December 2007</em></p>
                        <p>Key Responsibilities:</p>
                        <ul>
                            <li>Engineered embedded systems and provisioning solutions for VoIP-enabled devices, utilizing tools such as GCC, GDB, and embedded Linux.</li>
                            <li>Designed and developed user interfaces for network devices with a focus on usability and responsiveness, using HTML, JavaScript, and CSS.</li>
                            <li>Engaged in testing and debugging software components to ensure their reliability and performance.</li>
                        </ul>
                    </li>
                    <hr />
                    <li>
                        <strong>Software Developer Intern</strong>
                        <p><em>LOGO Yazılım, Ankara, July 2005 - September 2005</em></p>
                        <p>Key Responsibilities:</p>
                        <ul>
                            <li>Enhanced the usability and functionality of an open-source Java code editor by implementing a code-completion feature.</li>
                            <li>Worked alongside senior developers to grasp project requirements and design effective solutions.</li>
                            <li>Acquired practical experience in software development methodologies and practices within a professional setting.</li>
                        </ul>
                    </li>
                </ul>
            </section>

            <section>
                <h2>Education</h2>
                <ul>
                    <li>
                        <strong>Bachelor of Science in Computer Engineering</strong>
                        <p>Middle East Technical University, 2006</p>
                    </li>
                </ul>
            </section>

            <section>
                <h2>Languages & Frameworks</h2>
                <ul>
                    <li>C/C++, C#, Hack/PHP, Java, Javascript/Typescript, Object Pascal, Perl, Python, Rust, Scheme</li>
                    <li>AngularJS, ReactJS, ExtJS</li>
                </ul>
            </section>

            <section>
                <h2>Interests</h2>
                <ul>
                    <li>Distributed Systems (Scalability & Concurrency)</li>
                    <li>Applied Maths in Programming & Animation</li>
                    <li>Technical Writing</li>
                </ul>
            </section>
        </div>
    );
};

export default CV;